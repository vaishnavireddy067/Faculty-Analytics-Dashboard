from django.db import models
from django.contrib.auth.models import AbstractUser
from simple_history.models import HistoricalRecords

class Institution(models.Model):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=100, unique=True, help_text="e.g. mit.edu")
    logo = models.ImageField(upload_to='institutions/logos/', blank=True, null=True)
    established_year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('SUPERADMIN', 'Super Admin'), # Manages all institutions
        ('ADMIN', 'Admin'),            # Manages single institution
        ('IQAC', 'IQAC'),
        ('HOD', 'Head of Department'),
        ('FACULTY', 'Faculty'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='FACULTY')
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True) # Could be a ForeignKey to a Department model later
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
