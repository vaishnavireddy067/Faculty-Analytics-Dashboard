"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import api_current_user
from faculty_data.views import system_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', system_health_check, name='system_health_check_root'),
    path('api/auth/me/', api_current_user, name='api_current_user'),
    path('api/analytics/', include('analytics.urls')),
    path('api/faculty/', include('faculty_data.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
