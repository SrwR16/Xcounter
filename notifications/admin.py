from django.contrib import admin

from .models import Notification, NotificationType, UserNotificationPreference


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "is_active",
        "requires_email",
        "requires_inapp",
        "created_at",
    ]
    list_filter = ["is_active", "requires_email", "requires_inapp"]
    search_fields = ["name", "description"]
    fieldsets = [
        (None, {"fields": ["name", "description"]}),
        ("Templates", {"fields": ["template_subject", "template_content"]}),
        ("Settings", {"fields": ["is_active", "requires_email", "requires_inapp"]}),
    ]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "notification_type",
        "user_email",
        "subject",
        "status",
        "is_read",
        "is_email_sent",
        "created_at",
    ]
    list_filter = ["status", "is_read", "is_email_sent", "notification_type"]
    search_fields = ["user__email", "subject", "content"]
    readonly_fields = ["created_at", "updated_at", "read_at"]
    fieldsets = [
        (None, {"fields": ["user", "notification_type"]}),
        ("Content", {"fields": ["subject", "content", "data"]}),
        ("Status", {"fields": ["status", "is_read", "is_email_sent", "error_message"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at", "read_at"]}),
    ]

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        "user_email",
        "email_enabled",
        "inapp_enabled",
        "booking_confirmations",
        "booking_reminders",
        "promotions",
    ]
    list_filter = [
        "email_enabled",
        "inapp_enabled",
        "booking_confirmations",
        "booking_reminders",
        "promotions",
        "system_announcements",
    ]
    search_fields = ["user__email"]

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"
