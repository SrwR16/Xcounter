from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, UserNotificationPreference
from .serializers import NotificationSerializer, UserNotificationPreferenceSerializer
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
