from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message, Notification, UserNotificationPreference
from .serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
    NotificationSerializer,
    UserNotificationPreferenceSerializer,
)
from .utils import mark_notification_as_read, send_notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for managing notifications.
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "is_read"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Return only the notifications for the current user.
        """
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read.
        """
        notification = self.get_object()
        result = mark_notification_as_read(notification.id, request.user)

        if result:
            return Response({"status": "success"})
        return Response({"status": "error"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def mark_all_as_read(self, request):
        """
        Mark all unread notifications as read.
        """
        unread_notifications = Notification.objects.filter(
            user=request.user, is_read=False
        )

        now = timezone.now()
        count = unread_notifications.count()

        unread_notifications.update(is_read=True, read_at=now, updated_at=now)

        return Response({"status": "success", "count": count})


class UserNotificationPreferenceView(APIView):
    """
    API endpoint for managing user notification preferences.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get the user's notification preferences.
        """
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = UserNotificationPreferenceSerializer(preferences)
        return Response(serializer.data)

    def put(self, request):
        """
        Update the user's notification preferences.
        """
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = UserNotificationPreferenceSerializer(
            preferences, data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestNotificationView(APIView):
    """
    API endpoint for testing notifications.
    For development purposes only.
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        """
        Send a test notification.
        """
        notification_type_name = request.data.get("notification_type_name")
        target_email = request.data.get("target_email")
        context_data = request.data.get("context_data", {})

        if not notification_type_name:
            return Response(
                {"error": "notification_type_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import CustomUser

        if target_email:
            try:
                user = CustomUser.objects.get(email=target_email)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": f"User with email {target_email} does not exist"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            user = request.user

        notification = send_notification(user, notification_type_name, context_data)

        if notification:
            return Response({"status": "success", "notification_id": notification.id})
        return Response({"status": "error"}, status=status.HTTP_400_BAD_REQUEST)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing conversations.
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["updated_at", "created_at"]
    ordering = ["-updated_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_moderator:
            # Staff users can see all conversations
            return Conversation.objects.all()
        # Regular users can only see their own conversations
        return Conversation.objects.filter(user=user)

    def perform_create(self, serializer):
        """Set the user to the current user when creating a conversation."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        """Close a conversation."""
        conversation = self.get_object()
        conversation.is_closed = True
        conversation.save()
        return Response({"status": "conversation closed"})

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        """Reopen a closed conversation."""
        conversation = self.get_object()
        conversation.is_closed = False
        conversation.save()
        return Response({"status": "conversation reopened"})


class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing messages within conversations.
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get("conversation_pk")
        if conversation_id:
            # Check if the user has access to this conversation
            user = self.request.user
            conversation = get_object_or_404(Conversation, id=conversation_id)

            # Only allow access if the user is the conversation owner or staff
            if user == conversation.user or user.is_staff or user.is_moderator:
                return Message.objects.filter(conversation_id=conversation_id)

        return Message.objects.none()

    def perform_create(self, serializer):
        """Set the sender to the current user when creating a message."""
        conversation_id = self.kwargs.get("conversation_pk")
        conversation = get_object_or_404(Conversation, id=conversation_id)

        # Only allow message creation if user is the conversation owner or staff
        if (
            self.request.user == conversation.user
            or self.request.user.is_staff
            or self.request.user.is_moderator
        ):
            message = serializer.save(
                sender=self.request.user, conversation_id=conversation_id
            )

            # Update the conversation's updated_at timestamp
            conversation.save()  # This will trigger auto_now for updated_at

            # Send notification to the recipient
            recipient = None
            if self.request.user == conversation.user:
                # If sender is the customer, notify the staff users (send to admin for now)
                from users.models import CustomUser

                # Get an admin user to notify
                admins = CustomUser.objects.filter(is_staff=True)
                if admins.exists():
                    recipient = admins.first()
            else:
                # If sender is staff, notify the customer
                recipient = conversation.user

            if recipient:
                context_data = {
                    "subject": f"New message in {conversation.subject}",
                    "message": message.content[:100]
                    + ("..." if len(message.content) > 100 else ""),
                    "conversation_id": conversation.id,
                    "sender": self.request.user.email,
                }
                send_notification(recipient, "NEW_MESSAGE", context_data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request, conversation_pk=None):
        """Mark all messages in a conversation as read for the current user."""
        if conversation_pk:
            conversation = get_object_or_404(Conversation, id=conversation_pk)

            # Only allow access if the user is the conversation owner or staff
            if (
                request.user == conversation.user
                or request.user.is_staff
                or request.user.is_moderator
            ):
                # Mark messages not sent by this user as read
                unread_messages = Message.objects.filter(
                    conversation=conversation, is_read=False
                ).exclude(sender=request.user)

                count = unread_messages.count()
                unread_messages.update(is_read=True)

                return Response({"status": "success", "count": count})

        return Response(
            {"error": "You do not have permission to mark these messages as read"},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None, conversation_pk=None):
        """Mark a single message as read."""
        message = self.get_object()

        # Only mark messages as read if user is the conversation owner or staff
        if (
            request.user == message.conversation.user
            or request.user.is_staff
            or request.user.is_moderator
        ):
            if not message.is_read:
                message.is_read = True
                message.save()

            return Response({"status": "success"})

        return Response(
            {"error": "You do not have permission to mark this message as read"},
            status=status.HTTP_403_FORBIDDEN,
        )
