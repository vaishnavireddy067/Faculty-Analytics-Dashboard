from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
        try:
            clean_input = str(username).strip()
            clean_lower = clean_input.lower()
            candidates = User.objects.filter(
                Q(username__iexact=clean_input) |
                Q(username__iexact=clean_lower) |
                Q(email__iexact=clean_lower) |
                Q(email__istartswith=f"{clean_lower}@")
            ).order_by('-id')
            
            for user in candidates:
                if user.check_password(password) or user.check_password(str(password).strip()):
                    return user
        except Exception:
            return None
        return None


