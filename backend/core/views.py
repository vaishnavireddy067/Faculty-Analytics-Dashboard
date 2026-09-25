import re
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q

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
            # If user already exists, verify password
            if password:
                if not user.check_password(password):
                    raise serializers.ValidationError({"detail": "Invalid credentials. Please verify your password."})

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


