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
            email = username_or_email if is_email else f"{username_or_email}@example.com"
            base_username = username_or_email.split('@')[0] if is_email else username_or_email
            
            clean_username = re.sub(r'[^a-zA-Z0-9_.]', '', base_username) or 'faculty_user'
            unique_username = clean_username
            counter = 1
            while User.objects.filter(username__iexact=unique_username).exists():
                unique_username = f"{clean_username}_{counter}"
                counter += 1

            # Determine default role based on email/identifier hints or default to FACULTY
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
                password=password or 'password123',
                first_name=first_name,
                last_name=last_name
            )
            user.role = role
            user.department = 'Computer Science & Engineering'
            user.save()
        else:
            # If user already exists, verify or update password if provided
            if password:
                if not user.check_password(password):
                    user.set_password(password)
                    user.save()

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
            }
        }

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    try:
        data = request.data
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip()

        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=username,
            password=data.get('password') or 'password123',
            email=email,
            first_name=data.get('firstName', ''),
            last_name=data.get('lastName', '')
        )
        user.role = data.get('role', 'FACULTY')
        user.department = data.get('department', 'Computer Science & Engineering')
        user.phone_number = data.get('phone_number', '')
        user.save()
        
        return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

