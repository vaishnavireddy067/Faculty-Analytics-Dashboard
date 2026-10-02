from django.contrib.auth import get_user_model

User = get_user_model()

class OpenAccessMiddleware:
    """
    Open-Access Middleware:
    Bypasses all authentication checks across the application.
    Automatically assigns an active faculty user to request.user so all
    dashboard views, analytics, and reports function seamlessly without requiring login.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            # Attach default database user
            default_user = User.objects.filter(is_active=True).first() or User.objects.first()
            if default_user:
                request.user = default_user
        return self.get_response(request)
