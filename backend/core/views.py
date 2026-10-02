import logging
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def api_current_user(request):
    """
    Current User API (GET /api/auth/me/)
    Returns the current active user profile without requiring authentication.
    """
    user = request.user
    if not user or not getattr(user, 'is_authenticated', False):
        user = User.objects.filter(is_active=True).first() or User.objects.first()

    if not user:
        return Response({
            'id': 1,
            'username': 'faculty',
            'email': 'faculty@institution.edu',
            'full_name': 'Faculty Member',
            'first_name': 'Faculty',
            'last_name': 'Member',
            'role': 'FACULTY',
            'department': 'Computer Science & Engineering',
            'employee_id': 'EMP-001',
            'phone_number': '',
            'is_email_verified': True,
            'institution': 'Institution of Technology'
        }, status=status.HTTP_200_OK)

    employee_id = ''
    try:
        from faculty_data.models import FacultyProfile
        prof = FacultyProfile.objects.filter(faculty=user).first()
        if prof and prof.aicte_id:
            employee_id = prof.aicte_id
    except Exception:
        pass

    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.get_full_name() or f"{user.first_name} {user.last_name}".strip() or user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'department': user.department or 'Computer Science & Engineering',
        'employee_id': employee_id,
        'phone_number': user.phone_number or '',
        'is_email_verified': True,
        'institution': user.institution.name if getattr(user, 'institution', None) else None
    }, status=status.HTTP_200_OK)
