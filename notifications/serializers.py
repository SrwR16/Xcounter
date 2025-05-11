from rest_framework import serializers

from .models import Notification, NotificationType, UserNotificationPreference


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = [
            "id",
            "name",
            "description",
            "requires_email",
            "requires_inapp",
            "is_active",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_name = serializers.CharField(
        source="notification_type.name", read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "notification_type_name",
            "subject",
            "content",
            "status",
            "is_read",
            "created_at",
            "read_at",
        ]
        read_only_fields = [
            "notification_type",
            "notification_type_name",
            "subject",
            "content",
            "status",
            "created_at",
            "read_at",
        ]


class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationPreference
        fields = [
            "email_enabled",
            "inapp_enabled",
            "booking_confirmations",
            "booking_reminders",
            "booking_changes",
            "promotions",
            "system_announcements",
        ]

    def validate(self, data):
        """
        Ensure at least one notification channel is enabled.
        """
        if data.get("email_enabled") is False and data.get("inapp_enabled") is False:
            raise serializers.ValidationError(
                "At least one notification channel (email or in-app) must be enabled."
            )
        return data
