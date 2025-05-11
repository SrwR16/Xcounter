from django.contrib import admin
from django.utils.html import format_html

from .models import Conversation, Message, Notification, UserNotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_email",
        "notification_type_name",
        "subject",
        "status",
        "is_read",
        "is_email_sent",
        "created_at",
    )
    list_filter = (
        "notification_type",
        "status",
        "is_read",
        "is_email_sent",
        "created_at",
    )
    search_fields = ("user__email", "subject", "content")
    readonly_fields = ("created_at", "updated_at", "read_at")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "notification_type",
                    "notification_type_name",
                    "subject",
                    "content",
                    "related_id",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "status",
                    "is_read",
                    "is_email_sent",
                    "error_message",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at", "read_at")},
        ),
        (
            "Additional Data",
            {"fields": ("data",)},
        ),
    )

    def user_email(self, obj):
        return obj.user.email if obj.user else "System"

    user_email.short_description = "User"


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_email",
        "email_enabled",
        "inapp_enabled",
        "booking_confirmations",
        "booking_reminders",
        "promotions",
        "system_announcements",
    )
    list_filter = (
        "email_enabled",
        "inapp_enabled",
        "booking_confirmations",
        "booking_reminders",
        "promotions",
        "system_announcements",
    )
    search_fields = ("user__email",)
    readonly_fields = ("created_at", "updated_at")

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "user_email",
        "is_closed",
        "message_count",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_closed", "created_at", "updated_at")
    search_fields = ("subject", "user__email")
    readonly_fields = ("created_at", "updated_at")

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"

    def message_count(self, obj):
        return obj.messages.count()

    message_count.short_description = "Messages"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "conversation_subject",
        "sender_email",
        "preview",
        "is_read",
        "created_at",
    )
    list_filter = ("is_read", "created_at")
    search_fields = ("conversation__subject", "sender__email", "content")
    readonly_fields = ("created_at",)

    def conversation_subject(self, obj):
        return obj.conversation.subject

    conversation_subject.short_description = "Conversation"

    def sender_email(self, obj):
        return obj.sender.email

    sender_email.short_description = "Sender"

    def preview(self, obj):
        return format_html(
            '<span title="{}">{}</span>',
            obj.content,
            obj.content[:50] + "..." if len(obj.content) > 50 else obj.content,
        )

    preview.short_description = "Content"
