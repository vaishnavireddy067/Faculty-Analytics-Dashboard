from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    try:
        data = request.data
        if User.objects.filter(username=data.get('username')).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=data.get('username'),
            password=data.get('password'),
            email=data.get('email', ''),
            first_name=data.get('firstName', ''),
            last_name=data.get('lastName', '')
        )
        user.role = 'FACULTY'
        user.department = data.get('department', '')
        user.phone_number = data.get('phone_number', '')
        user.save()
        
        return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
