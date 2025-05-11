from rest_framework import serializers

from .models import (
    Conversation,
    Message,
    Notification,
    NotificationType,
    UserNotificationPreference,
)


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
            "message_notifications",
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


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source="sender.email")

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_email",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "sender",
            "sender_email",
            "is_read",
            "created_at",
            "conversation",
        ]
        extra_kwargs = {"conversation": {"required": False}}


class ConversationListSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "subject",
            "user",
            "user_email",
            "is_closed",
            "last_message",
            "message_count",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "user_email",
            "is_closed",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"user": {"required": False}}

    def get_last_message(self, obj):
        last_message = obj.messages.order_by("-created_at").first()
        if last_message:
            return {
                "content": last_message.content[:100]
                + ("..." if len(last_message.content) > 100 else ""),
                "sender_email": last_message.sender.email,
                "created_at": last_message.created_at,
            }
        return None

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_unread_count(self, obj):
        # Count unread messages not sent by the current user
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            return (
                obj.messages.filter(is_read=False).exclude(sender=request.user).count()
            )
        return 0


class ConversationDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "subject",
            "user",
            "user_email",
            "is_closed",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "user_email",
            "messages",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"user": {"required": False}}
