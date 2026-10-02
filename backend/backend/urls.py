"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import (
    CustomTokenObtainPairView, 
    api_auth_login,
    api_current_user,
    api_register, 
    google_auth_login, 
    google_auth_config,
    send_registration_otp,
    verify_registration_otp,
    api_resend_otp,
    api_reset_password
)
from faculty_data.views import system_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', api_auth_login, name='api_auth_login'),
    path('api/auth/me/', api_current_user, name='api_current_user'),
    path('api/register/', api_register, name='api_register'),
    path('api/auth/register/', send_registration_otp, name='api_auth_register'),
    path('api/auth/send-otp/', send_registration_otp, name='send_registration_otp'),
    path('api/auth/verify-otp/', verify_registration_otp, name='verify_registration_otp'),
    path('api/auth/resend-otp/', api_resend_otp, name='api_resend_otp'),
    path('api/auth/reset-password/', api_reset_password, name='api_reset_password'),
    path('api/auth/google/', google_auth_login, name='google_auth_login'),
    path('api/auth/google/config/', google_auth_config, name='google_auth_config'),
    path('api/health/', system_health_check, name='system_health_check_root'),
    path('api/analytics/', include('analytics.urls')),
    path('api/faculty/', include('faculty_data.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
