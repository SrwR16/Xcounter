from django.conf import settings
from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    """
    Represents a conversation between a customer and staff members
    """

    subject = models.CharField(max_length=255)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["customer", "-updated_at"]),
            models.Index(fields=["is_closed"]),
        ]

    def __str__(self):
        return f"Conversation: {self.subject} - {self.customer.email}"

    def mark_all_as_read(self, user):
        """Mark all messages in conversation as read for a specific user"""
        # If user is customer, mark all staff messages as read
        if user == self.customer:
            self.messages.exclude(sender=user).update(is_read=True)
        # If user is staff, mark all customer messages as read
        else:
            self.messages.filter(sender=self.customer).update(is_read=True)


class Message(models.Model):
    """
    Represents a message within a conversation
    """

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["sender"]),
            models.Index(fields=["is_read"]),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} in {self.conversation.subject}"

    def mark_as_read(self):
        """Mark the message as read and update read_at timestamp"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class StaffAssignment(models.Model):
    """
    Represents a staff member assigned to a conversation
    """

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="staff_assignments"
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_conversations",
        limit_choices_to={"is_staff": True},
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("conversation", "staff")
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.staff.email} assigned to {self.conversation.subject}"
