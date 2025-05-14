# Create your models here.

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "ADMIN")

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("MODERATOR", "Moderator"),
        ("SALESMAN", "Salesman"),
        ("CUSTOMER", "Customer"),
    )

    username = None
    email = models.EmailField(_("email address"), unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="CUSTOMER")
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # For 2FA (to be implemented later)
    two_factor_enabled = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == "ADMIN"

    @property
    def is_moderator(self):
        return self.role == "MODERATOR"

    @property
    def is_salesman(self):
        return self.role == "SALESMAN"

    @property
    def is_customer(self):
        return self.role == "CUSTOMER"


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="profile"
    )
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )

    # Additional fields based on user role
    date_of_birth = models.DateField(null=True, blank=True)

    # For employees (Salesman/Moderator)
    employee_id = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email}'s profile"


class TwoFactorCode(models.Model):
    """
    Model to store two-factor authentication codes for admin and moderator users.
    """

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="two_factor_codes"
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"2FA Code for {self.user.email}"

    @classmethod
    def generate_code(cls, user):
        """Generate a new 2FA code for a user and invalidate previous codes."""
        # Invalidate previous codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate a random 6-digit code
        import random

        code = "".join([str(random.randint(0, 9)) for _ in range(6)])

        # Set expiration time (10 minutes from now)
        import datetime

        from django.utils import timezone

        expires_at = timezone.now() + datetime.timedelta(minutes=10)

        # Create and return the code
        return cls.objects.create(user=user, code=code, expires_at=expires_at)

    def is_valid(self):
        """Check if the code is valid (not used and not expired)."""
        from django.utils import timezone

        return not self.is_used and self.expires_at > timezone.now()

    def is_expired(self):
        """Check if the code has expired."""
        from django.utils import timezone

        return self.expires_at <= timezone.now()
