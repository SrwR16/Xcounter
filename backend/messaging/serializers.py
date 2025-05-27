from rest_framework import serializers
from users.serializers import UserMinimalSerializer

from .models import Conversation, Message, StaffAssignment


class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserMinimalSerializer(source="sender", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_details",
            "content",
            "created_at",
            "is_read",
            "read_at",
        ]
        read_only_fields = ["id", "created_at", "is_read", "read_at", "sender_details"]


class StaffAssignmentSerializer(serializers.ModelSerializer):
    staff_details = UserMinimalSerializer(source="staff", read_only=True)

    class Meta:
        model = StaffAssignment
        fields = ["id", "conversation", "staff", "staff_details", "assigned_at"]
        read_only_fields = ["id", "assigned_at", "staff_details"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer_details = UserMinimalSerializer(source="customer", read_only=True)
    staff_assignments = StaffAssignmentSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "subject",
            "customer",
            "customer_details",
            "created_at",
            "updated_at",
            "is_closed",
            "messages",
            "staff_assignments",
            "unread_count",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "customer_details",
            "messages",
            "staff_assignments",
            "unread_count",
        ]

    def get_unread_count(self, obj):
        """Get count of unread messages for current user"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        user = request.user
        if user == obj.customer:
            # If user is customer, count unread messages from staff
            return obj.messages.exclude(sender=user).filter(is_read=False).count()
        else:
            # If user is staff, count unread messages from customer
            return obj.messages.filter(sender=obj.customer, is_read=False).count()


class ConversationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing conversations"""

    customer_details = UserMinimalSerializer(source="customer", read_only=True)
    latest_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    assigned_staff = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "subject",
            "customer",
            "customer_details",
            "created_at",
            "updated_at",
            "is_closed",
            "latest_message",
            "unread_count",
            "assigned_staff",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "customer_details",
            "latest_message",
            "unread_count",
            "assigned_staff",
        ]

    def get_latest_message(self, obj):
        """Get the latest message in the conversation"""
        latest = obj.messages.order_by("-created_at").first()
        if latest:
            return {
                "id": latest.id,
                "content": latest.content[:100] + "..."
                if len(latest.content) > 100
                else latest.content,
                "created_at": latest.created_at,
                "sender_id": latest.sender.id,
                "is_read": latest.is_read,
            }
        return None

    def get_unread_count(self, obj):
        """Get count of unread messages for current user"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        user = request.user
        if user == obj.customer:
            # If user is customer, count unread messages from staff
            return obj.messages.exclude(sender=user).filter(is_read=False).count()
        else:
            # If user is staff, count unread messages from customer
            return obj.messages.filter(sender=obj.customer, is_read=False).count()

    def get_assigned_staff(self, obj):
        """Get list of assigned staff members"""
        assignments = obj.staff_assignments.all()
        return [
            {
                "id": assignment.staff.id,
                "name": assignment.staff.get_full_name() or assignment.staff.email,
                "email": assignment.staff.email,
            }
            for assignment in assignments
        ]
