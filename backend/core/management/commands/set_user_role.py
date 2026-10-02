from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Assigns a role (FACULTY, HOD, ADMIN, IQAC, SUPERADMIN) to any user by email, or creates them if they do not exist.'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address of the user')
        parser.add_argument('role', type=str, choices=['FACULTY', 'HOD', 'ADMIN', 'IQAC', 'SUPERADMIN'], help='Role to assign')
        parser.add_argument('--password', type=str, default=None, help='Set/reset user password')
        parser.add_argument('--department', type=str, default='', help='Academic department')
        parser.add_argument('--first-name', type=str, default='', help='First name')
        parser.add_argument('--last-name', type=str, default='', help='Last name')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        role = options['role'].upper()
        password = options.get('password')
        department = options.get('department')
        first_name = options.get('first_name')
        last_name = options.get('last_name')

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            username = email.split('@')[0]
            counter = 1
            base_u = username
            while User.objects.filter(username__iexact=username).exists():
                username = f"{base_u}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name or 'Faculty',
                last_name=last_name or 'Member',
            )
            self.stdout.write(self.style.SUCCESS(f"Created new user account: {email}"))
        else:
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name

        user.role = role
        user.is_email_verified = True
        user.is_active = True

        if department:
            user.department = department

        if password:
            user.set_password(password)

        if role in ['ADMIN', 'SUPERADMIN']:
            user.is_staff = True
        if role == 'SUPERADMIN':
            user.is_superuser = True

        user.save()

        # Ensure faculty profile exists
        try:
            from faculty_data.models import FacultyProfile
            FacultyProfile.objects.get_or_create(faculty=user)
        except Exception:
            pass

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully set {email} -> Role: {role}, Department: {user.department or 'None'}"
            )
        )
