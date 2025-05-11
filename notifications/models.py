from django.db import models

from users.models import CustomUser


class NotificationType(models.Model):
    """
    Defines the different types of notifications that can be sent.
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    template_subject = models.CharField(max_length=200)
    template_content = models.TextField()
    is_active = models.BooleanField(default=True)
    requires_email = models.BooleanField(default=True)
    requires_inapp = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class Notification(models.Model):
    """
    Stores individual notifications sent to users.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        READ = "READ", "Read"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.ForeignKey(
        NotificationType, on_delete=models.CASCADE, related_name="notifications"
    )

    subject = models.CharField(max_length=200)
    content = models.TextField()
    data = models.JSONField(
        null=True, blank=True
    )  # Additional data for rendering templates

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    error_message = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.notification_type} for {self.user.email}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["notification_type"]),
            models.Index(fields=["status"]),
        ]


class UserNotificationPreference(models.Model):
    """
    Stores user preferences for receiving different types of notifications.
    """

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    email_enabled = models.BooleanField(default=True)
    inapp_enabled = models.BooleanField(default=True)

    # Specific notification type preferences (can be extended as needed)
    booking_confirmations = models.BooleanField(default=True)
    booking_reminders = models.BooleanField(default=True)
    booking_changes = models.BooleanField(default=True)
    promotions = models.BooleanField(default=True)
    system_announcements = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s notification preferences"
