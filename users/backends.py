from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Authenticates against settings.AUTH_USER_MODEL using email instead of username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Try to get the user by email
            user = User.objects.get(Q(email__iexact=username))
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a non-existing user.
            User().set_password(password)
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
