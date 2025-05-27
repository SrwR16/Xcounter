from django.db import models
from django.utils import timezone
from users.models import CustomUser


class NotificationType(models.TextChoices):
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION", "Booking Confirmation"
    BOOKING_CANCELLATION = "BOOKING_CANCELLATION", "Booking Cancellation"
    PAYMENT_CONFIRMATION = "PAYMENT_CONFIRMATION", "Payment Confirmation"
    TICKET_READY = "TICKET_READY", "Ticket Ready"
    SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT", "System Announcement"
    SHOW_REMINDER = "SHOW_REMINDER", "Show Reminder"
    MOVIE_PREMIERE = "MOVIE_PREMIERE", "Movie Premiere"
    USER_INACTIVITY = "USER_INACTIVITY", "User Inactivity"
    PROMOTION = "PROMOTION", "Promotion"
    REVIEW_RESPONSE = "REVIEW_RESPONSE", "Review Response"
    NEW_MESSAGE = "NEW_MESSAGE", "New Message"  # Added for message notifications


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
        CustomUser,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM_ANNOUNCEMENT,
    )
    notification_type_name = models.CharField(max_length=100, blank=True)

    subject = models.CharField(max_length=200)
    content = models.TextField()
    related_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Optional ID of related object (e.g. booking ID, conversation ID)",
    )
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
        user_email = self.user.email if self.user else "System"
        return f"{self.get_notification_type_display()} for {user_email}"

    def save(self, *args, **kwargs):
        # Set notification_type_name based on notification_type
        self.notification_type_name = self.get_notification_type_display()
        super().save(*args, **kwargs)

    def mark_as_read(self):
        """Mark the notification as read and update read_at timestamp"""
        self.is_read = True
        self.read_at = timezone.now()
        self.status = self.Status.READ
        self.save()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["notification_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["related_id"]),
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
    message_notifications = models.BooleanField(default=True)
    show_reminders = models.BooleanField(default=True)
    movie_premieres = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s notification preferences"
