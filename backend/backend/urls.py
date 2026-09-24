"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import CustomTokenObtainPairView, api_register
from faculty_data.views import system_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', api_register, name='api_register'),
    path('api/health/', system_health_check, name='system_health_check_root'),
    path('api/analytics/', include('analytics.urls')),
    path('api/faculty/', include('faculty_data.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
