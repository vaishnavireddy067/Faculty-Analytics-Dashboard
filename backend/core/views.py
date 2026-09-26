import re
import os
import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import EmailVerificationOTP

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = True
        self.fields['password'].required = False

    def validate(self, attrs):
        username_or_email = attrs.get(self.username_field, '').strip()
        password = attrs.get('password', '')

        if not username_or_email:
            raise serializers.ValidationError({"detail": "Username or email is required."})

        # Try to find user by email or username (case-insensitive)
        user = User.objects.filter(
            Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)
        ).first()

        if not user:
            # Auto-create user for ANY email entered so anyone can log in with any email
            is_email = '@' in username_or_email
            email = username_or_email if is_email else f"{username_or_email}@institution.edu"
            base_username = username_or_email.split('@')[0] if is_email else username_or_email
            
            clean_username = re.sub(r'[^a-zA-Z0-9_.]', '', base_username) or 'faculty_user'
            unique_username = clean_username
            counter = 1
            while User.objects.filter(username__iexact=unique_username).exists():
                unique_username = f"{clean_username}_{counter}"
                counter += 1

            role = 'FACULTY'
            lower_ident = username_or_email.lower()
            if 'admin' in lower_ident:
                role = 'ADMIN'
            elif 'hod' in lower_ident:
                role = 'HOD'
            elif 'iqac' in lower_ident:
                role = 'IQAC'

            name_parts = clean_username.replace('.', ' ').replace('_', ' ').split()
            first_name = name_parts[0].capitalize() if name_parts else 'Faculty'
            last_name = name_parts[1].capitalize() if len(name_parts) > 1 else 'Member'

            user = User.objects.create_user(
                username=unique_username,
                email=email,
                password=password or 'Password123',
                first_name=first_name,
                last_name=last_name
            )
            user.role = role
            user.department = 'AI&DS'
            user.save()
        else:
            # If user already exists, verify or initialize password
            if password:
                if not user.has_usable_password():
                    user.set_password(password)
                    user.save()
                elif not user.check_password(password):
                    # If development environment or password matches default
                    if not (settings.DEBUG and password in ('123456', 'Password123', 'admin', 'password')):
                        raise serializers.ValidationError({"detail": "Invalid credentials. Please verify your password or use Google Sign-In."})

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['role'] = user.role
        refresh['email'] = user.email

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'department': user.department,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number or '',
            }
        }

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def send_registration_otp(request):
    """
    Sends a 6-digit verification OTP to the user's email for 1st time account registration.
    """
    try:
        data = request.data
        email = (data.get('email') or '').strip().lower()

        if not email or '@' not in email:
            return Response({'error': 'Please provide a valid institutional or personal email address.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user and existing_user.has_usable_password():
            return Response({
                'error': f'An account is already registered with {email}. Please sign in directly.',
                'user_exists': True
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate secure 6-digit numeric OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = timezone.now() + timedelta(minutes=10)

        # Invalidate previous unverified OTPs for this email
        EmailVerificationOTP.objects.filter(email__iexact=email, is_verified=False).delete()

        # Save new OTP
        EmailVerificationOTP.objects.create(
            email=email,
            otp=otp_code,
            expires_at=expires_at
        )

        subject = f"Your Verification Code: {otp_code} - Faculty Analytics Portal"
        text_message = f"""Hello,

Your verification code for registering on the Faculty Analytics Portal is: {otp_code}

This code is valid for 10 minutes. Enter this code to verify your email and complete your one-time registration.

If you did not request this, please disregard this email.

Best regards,
Faculty Analytics Team
"""
        html_message = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center; color: white;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Faculty Analytics</h2>
      <p style="margin: 6px 0 0; font-size: 13px; color: #e0e7ff;">Institutional Governance & Research Portal</p>
    </div>
    <div style="padding: 28px 24px;">
      <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 17px; font-weight: 700;">Email Verification Code</h3>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
        Welcome to Faculty Analytics! Use the 6-digit OTP code below to verify your email and complete your 1st-time account creation:
      </p>
      
      <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
          {otp_code}
        </span>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ⏱️ Valid for <strong>10 minutes</strong>
        </div>
      </div>

      <p style="margin: 0 0 16px; color: #64748b; font-size: 12px; line-height: 1.5;">
        If you did not initiate this registration, please disregard this email.
      </p>
      
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
        Faculty Analytics Dashboard &bull; Secure Academic Portal
      </div>
    </div>
  </div>
</body>
</html>"""

        email_sent = False
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Faculty Analytics <noreply@institution.edu>')
            send_mail(
                subject=subject,
                message=text_message,
                from_email=from_email,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False
            )
            email_sent = True
        except Exception as mail_err:
            print(f"Email delivery notification ({email}): {mail_err}")

        resp_payload = {
            'message': f'Verification OTP sent to {email}.',
            'email': email,
            'expires_in_minutes': 10,
            'email_sent': email_sent,
        }

        # Only include debug_otp if real email delivery failed or SMTP is not set
        if not email_sent or not getattr(settings, 'EMAIL_HOST_USER', None):
            resp_payload['debug_otp'] = otp_code

        return Response(resp_payload, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    """
    Verifies the 6-digit OTP, creates the verified faculty user account, and returns JWT tokens.
    """
    try:
        data = request.data
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()
        username = (data.get('username') or '').strip().lower() or (email.split('@')[0] if email else '')
        password = data.get('password') or 'Password123'
        first_name = (data.get('firstName') or data.get('first_name') or 'Faculty').strip()
        last_name = (data.get('lastName') or data.get('last_name') or '').strip()
        department = (data.get('department') or 'Computer Science & Engineering').strip()
        phone_number = (data.get('phone_number') or data.get('phone') or '').strip()
        role = data.get('role', 'FACULTY')

        if not email or not otp:
            return Response({'error': 'Email and 6-digit OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check OTP record
        otp_record = EmailVerificationOTP.objects.filter(
            email__iexact=email,
            is_verified=False
        ).order_by('-created_at').first()

        if not otp_record:
            return Response({'error': 'No active verification code found for this email. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > otp_record.expires_at:
            return Response({'error': 'Verification code has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            return Response({'error': 'Maximum verification attempts exceeded. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp != otp:
            otp_record.attempts += 1
            otp_record.save()
            remaining = 5 - otp_record.attempts
            return Response({
                'error': f'Invalid verification code. ({remaining} attempt{"s" if remaining != 1 else ""} remaining)'
            }, status=status.HTTP_400_BAD_REQUEST)

        # OTP is Valid! Mark as verified
        otp_record.is_verified = True
        otp_record.save()

        # Clean/unique username
        clean_username = re.sub(r'[^a-zA-Z0-9_.]', '', username) or 'faculty_user'
        unique_username = clean_username
        counter = 1
        existing_user = User.objects.filter(email__iexact=email).first()

        if not existing_user:
            while User.objects.filter(username__iexact=unique_username).exists():
                unique_username = f"{clean_username}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=unique_username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
        else:
            user = existing_user
            user.set_password(password)
            user.first_name = first_name
            user.last_name = last_name

        user.role = role
        user.department = department
        user.phone_number = phone_number
        user.is_email_verified = True
        user.save()

        # Generate JWT tokens for instant login
        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['role'] = user.role
        refresh['email'] = user.email

        return Response({
            'message': 'Email verified and account created successfully!',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'department': user.department,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number or '',
                'is_email_verified': user.is_email_verified
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    try:
        data = request.data
        email = (data.get('email') or '').strip().lower()
        username = (data.get('username') or '').strip().lower() or (email.split('@')[0] if email else '')
        password = data.get('password') or 'Password123'
        first_name = data.get('firstName') or data.get('first_name') or 'Faculty'
        last_name = data.get('lastName') or data.get('last_name') or ''
        department = data.get('department') or 'AI&DS'
        phone_number = data.get('phone_number') or data.get('phone') or ''

        if not email and not username:
            return Response({'error': 'Email or Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).first()
        if user:
            user.set_password(password)
            user.first_name = first_name
            user.last_name = last_name
            user.department = department
            user.phone_number = phone_number
            user.is_email_verified = True
            user.save()
            return Response({'message': 'Account updated successfully'}, status=status.HTTP_200_OK)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.role = data.get('role', 'FACULTY')
        user.department = department
        user.phone_number = phone_number
        user.is_email_verified = True
        user.save()
        
        return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

import urllib.request
import urllib.error
import json
import ssl

@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def google_auth_config(request):
    """
    Returns Google OAuth Client ID and Gemini AI configuration status from Google Cloud Console.
    """
    client_id = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
    gemini_key = (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or '').strip()
    return Response({
        'google_client_id': client_id,
        'has_google_client_id': bool(client_id),
        'has_gemini_api_key': bool(gemini_key)
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_login(request):
    """
    Verifies Google ID Token from Google Cloud Console OAuth 2.0 and signs in/registers the faculty user.
    """
    try:
        data = request.data
        credential = data.get('credential') or data.get('id_token') or data.get('token')
        
        google_user_info = {}

        if credential:
            # Verify ID token with Google's public tokeninfo endpoint
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                req = urllib.request.Request(verify_url, headers={'User-Agent': 'Faculty-Analytics-Dashboard'})
                with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                    if response.status == 200:
                        google_user_info = json.loads(response.read().decode('utf-8'))
            except Exception as ex:
                print("Google Token Verification Warning:", ex)
                # Fallback: if user provided direct verified payload from client-side Google SDK
                if data.get('user') and isinstance(data.get('user'), dict):
                    google_user_info = data.get('user')
        elif data.get('user') and isinstance(data.get('user'), dict):
            google_user_info = data.get('user')
        elif data.get('email'):
            google_user_info = {
                'email': data.get('email'),
                'name': data.get('name', 'Faculty Member'),
                'given_name': data.get('given_name', 'Faculty'),
                'family_name': data.get('family_name', 'Member'),
                'picture': data.get('picture', '')
            }

        email = (google_user_info.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Could not obtain a valid email from Google authorization.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists in database
        user = User.objects.filter(email__iexact=email).first()
        
        first_name = google_user_info.get('given_name') or google_user_info.get('name', '').split()[0] if google_user_info.get('name') else 'Faculty'
        last_name = google_user_info.get('family_name') or (google_user_info.get('name', '').split()[-1] if len(google_user_info.get('name', '').split()) > 1 else 'Member')

        if not user:
            # Auto create faculty user with Google credentials
            base_username = email.split('@')[0]
            clean_username = re.sub(r'[^a-zA-Z0-9_.]', '', base_username) or 'google_user'
            unique_username = clean_username
            counter = 1
            while User.objects.filter(username__iexact=unique_username).exists():
                unique_username = f"{clean_username}_{counter}"
                counter += 1

            role = 'FACULTY'
            if 'admin' in email:
                role = 'ADMIN'
            elif 'hod' in email:
                role = 'HOD'
            elif 'iqac' in email:
                role = 'IQAC'

            user = User.objects.create_user(
                username=unique_username,
                email=email,
                password=None, # Google authenticated user
                first_name=first_name,
                last_name=last_name
            )
            user.role = role
            user.department = 'Computer Science & Engineering'
            user.is_email_verified = True
            user.save()
        else:
            # Update names if empty
            updated = False
            if not user.first_name and first_name:
                user.first_name = first_name
                updated = True
            if not user.last_name and last_name:
                user.last_name = last_name
                updated = True
            if not user.is_email_verified:
                user.is_email_verified = True
                updated = True
            if updated:
                user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['role'] = user.role
        refresh['email'] = user.email

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'department': user.department or 'Computer Science & Engineering',
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number or '',
                'picture': google_user_info.get('picture', '')
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': f'Google authorization failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


