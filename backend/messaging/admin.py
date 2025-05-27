from django.contrib import admin

from .models import Conversation, Message, StaffAssignment


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("sender", "created_at", "is_read")
    fields = ("sender", "content", "created_at", "is_read")


class StaffAssignmentInline(admin.TabularInline):
    model = StaffAssignment
    extra = 0
    raw_id_fields = ("staff",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "customer",
        "created_at",
        "updated_at",
        "is_closed",
    )
    list_filter = ("is_closed", "created_at", "updated_at")
    search_fields = (
        "subject",
        "customer__email",
        "customer__first_name",
        "customer__last_name",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("customer",)
    inlines = [StaffAssignmentInline, MessageInline]
    date_hierarchy = "created_at"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "conversation",
        "sender",
        "short_content",
        "created_at",
        "is_read",
    )
    list_filter = ("is_read", "created_at")
    search_fields = ("content", "sender__email", "conversation__subject")
    readonly_fields = ("created_at",)
    raw_id_fields = ("conversation", "sender")

    def short_content(self, obj):
        if len(obj.content) > 50:
            return obj.content[:50] + "..."
        return obj.content

    short_content.short_description = "Content"


@admin.register(StaffAssignment)
class StaffAssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "staff", "assigned_at")
    list_filter = ("assigned_at",)
    search_fields = (
        "conversation__subject",
        "staff__email",
        "staff__first_name",
        "staff__last_name",
    )
    readonly_fields = ("assigned_at",)
    raw_id_fields = ("conversation", "staff")
    date_hierarchy = "assigned_at"
