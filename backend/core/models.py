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
    is_email_verified = models.BooleanField(default=False)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"

class EmailVerificationOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Verification OTP'
        verbose_name_plural = 'Email Verification OTPs'

    def __str__(self):
        return f"{self.email} - {self.otp} ({'Verified' if self.is_verified else 'Pending'})"
