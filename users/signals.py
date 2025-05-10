from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.crypto import get_random_string

from .models import CustomUser, UserProfile


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to create a user profile when a new user is registered.
    """
    if created:
        # Generate employee ID for staff members
        employee_id = ""
        if instance.role in ["ADMIN", "MODERATOR", "SALESMAN"]:
            prefix = instance.role[0]  # First letter of role
            random_digits = get_random_string(length=5, allowed_chars="0123456789")
            employee_id = f"{prefix}-{random_digits}"

        UserProfile.objects.create(user=instance, employee_id=employee_id)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to save user profile when user is saved.
    """
    if hasattr(instance, "profile"):
        instance.profile.save()
