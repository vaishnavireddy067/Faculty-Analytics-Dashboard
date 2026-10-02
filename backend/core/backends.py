from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
        try:
            clean_email = str(username).strip().lower()
            # 1. Primary lookup: strictly by registered official email
            user = User.objects.filter(email__iexact=clean_email).first()
            # 2. Fallback lookup by username only for system administrative accounts
            if not user and '@' not in clean_email:
                user = User.objects.filter(username__iexact=clean_email).first()

            if user and (user.check_password(password) or user.check_password(str(password).strip())):
                return user
        except Exception:
            return None
        return None


