from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None
        try:
            user = User.objects.filter(
                Q(username__iexact=username.strip()) | Q(email__iexact=username.strip())
            ).first()
            if user:
                if password and user.check_password(password):
                    return user
        except Exception:
            return None
        return None

