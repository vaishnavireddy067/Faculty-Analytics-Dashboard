import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial verified faculty, HOD, and admin accounts'

    def handle(self, *args, **options):
        accounts = [
            {
                'email': 'admin@example.com',
                'username': 'admin',
                'password': 'admin123',
                'role': 'ADMIN',
                'first_name': 'System',
                'last_name': 'Administrator',
                'department': 'Administration',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'hod@example.com',
                'username': 'hod_cs',
                'password': 'hod123',
                'role': 'HOD',
                'first_name': 'Dr. HOD',
                'last_name': 'CSE',
                'department': 'Computer Science & Engineering',
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        for acc in accounts:
            user = User.objects.filter(email__iexact=acc['email']).first()
            if not user:
                user = User.objects.create_user(
                    username=acc['username'],
                    email=acc['email'],
                    password=acc['password'],
                    first_name=acc['first_name'],
                    last_name=acc['last_name'],
                )
                self.stdout.write(self.style.SUCCESS(f"Created account: {acc['email']}"))
            else:
                user.set_password(acc['password'])
                user.first_name = acc['first_name']
                user.last_name = acc['last_name']
                self.stdout.write(self.style.WARNING(f"Updated password for: {acc['email']}"))

            user.role = acc['role']
            user.department = acc['department']
            user.is_email_verified = True
            user.is_active = True
            user.is_staff = acc['is_staff']
            user.is_superuser = acc['is_superuser']
            user.save()

            # Ensure FacultyProfile
            try:
                from faculty_data.models import FacultyProfile
                FacultyProfile.objects.get_or_create(faculty=user)
            except Exception:
                pass

        self.stdout.write(self.style.SUCCESS("All default accounts successfully seeded and ready!"))
