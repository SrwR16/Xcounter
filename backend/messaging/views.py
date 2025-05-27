from django.shortcuts import get_object_or_404
from notifications.models import Notification, NotificationType
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from users.models import CustomUser

from .models import Conversation, Message, StaffAssignment
from .serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
    StaffAssignmentSerializer,
)


class IsCustomerOrStaff(permissions.BasePermission):
    """
    Custom permission to allow customers to access only their own conversations,
    and staff members (admin/moderator) to access all conversations.
    """

    def has_object_permission(self, request, view, obj):
        # Staff can access all conversations
        if request.user.is_staff or request.user.is_moderator:
            return True

        # Customers can only access their own conversations
        return request.user == obj.customer


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Conversations, providing endpoints for customers to create
    and manage support conversations, and for staff to respond.
    """

    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerOrStaff]

    def get_queryset(self):
        user = self.request.user

        # For customers, show only their conversations
        if user.is_customer:
            return Conversation.objects.filter(customer=user).order_by("-updated_at")

        # For staff members, filter by assignments or show all
        if user.is_staff or user.is_moderator:
            if self.action == "assigned_to_me":
                return Conversation.objects.filter(
                    staff_assignments__staff=user
                ).order_by("-updated_at")

            return Conversation.objects.all().order_by("-updated_at")

        # For salesmen and other roles, return empty queryset
        return Conversation.objects.none()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationListSerializer

    def perform_create(self, serializer):
        # Set the customer to the current user
        serializer.save(customer=self.request.user)

    @action(detail=False, methods=["get"])
    def assigned_to_me(self, request):
        """
        Return only conversations assigned to the current staff member
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        """
        Close a conversation
        """
        conversation = self.get_object()
        conversation.is_closed = True
        conversation.save()

        return Response({"status": "conversation closed"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        """
        Reopen a closed conversation
        """
        conversation = self.get_object()
        conversation.is_closed = False
        conversation.save()

        return Response({"status": "conversation reopened"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """
        Assign a staff member to a conversation
        """
        conversation = self.get_object()

        # Only staff or moderators can assign staff
        if not request.user.is_staff and not request.user.is_moderator:
            return Response(
                {"error": "Only staff or moderators can assign staff members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        staff_id = request.data.get("staff_id")
        if not staff_id:
            return Response(
                {"error": "staff_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            staff = CustomUser.objects.get(id=staff_id)
            if not (staff.is_staff or staff.is_moderator):
                return Response(
                    {"error": "User is not a staff member"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create or update the assignment
            assignment, created = StaffAssignment.objects.get_or_create(
                conversation=conversation, staff=staff
            )

            if not created:
                # Update the timestamp
                assignment.save()

            return Response(
                StaffAssignmentSerializer(assignment).data, status=status.HTTP_200_OK
            )

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Staff member not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"])
    def unassign(self, request, pk=None):
        """
        Remove a staff assignment from a conversation
        """
        conversation = self.get_object()

        # Only staff or moderators can unassign staff
        if not request.user.is_staff and not request.user.is_moderator:
            return Response(
                {"error": "Only staff or moderators can unassign staff members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        staff_id = request.data.get("staff_id")
        if not staff_id:
            return Response(
                {"error": "staff_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            assignment = StaffAssignment.objects.get(
                conversation=conversation, staff_id=staff_id
            )
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except StaffAssignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """
        Return the count of conversations with unread messages
        """
        user = request.user

        if user.is_customer:
            # For customers, count conversations with unread messages from staff
            conversations = Conversation.objects.filter(customer=user)
            unread_count = 0

            for conversation in conversations:
                unread_messages = (
                    Message.objects.filter(conversation=conversation, is_read=False)
                    .exclude(sender=user)
                    .count()
                )

                if unread_messages > 0:
                    unread_count += 1

            return Response({"unread_count": unread_count})

        elif user.is_staff or user.is_moderator:
            # For staff, count assigned conversations with unread customer messages
            if request.query_params.get("all", "false").lower() == "true":
                # Count all conversations with unread messages if 'all' is true
                conversations = Conversation.objects.all()
            else:
                # Otherwise, count only assigned conversations
                conversations = Conversation.objects.filter(
                    staff_assignments__staff=user
                )

            unread_count = 0
            for conversation in conversations:
                unread_messages = Message.objects.filter(
                    conversation=conversation,
                    sender=conversation.customer,
                    is_read=False,
                ).count()

                if unread_messages > 0:
                    unread_count += 1

            return Response({"unread_count": unread_count})

        # For other user types, return 0
        return Response({"unread_count": 0})


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling messages within a conversation
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get("conversation_pk")
        if not conversation_id:
            return Message.objects.none()

        conversation = get_object_or_404(Conversation, id=conversation_id)

        # Check if the user has permission to view this conversation
        if self.request.user.is_staff or self.request.user.is_moderator:
            # Staff can view all messages
            return Message.objects.filter(conversation=conversation).order_by(
                "-created_at"
            )
        elif self.request.user == conversation.customer:
            # Customers can only view their own conversations
            return Message.objects.filter(conversation=conversation).order_by(
                "-created_at"
            )

        # Other users cannot view messages
        return Message.objects.none()

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get("conversation_pk")
        conversation = get_object_or_404(Conversation, id=conversation_id)

        # Check if the user has permission to add messages to this conversation
        if (
            self.request.user.is_staff
            or self.request.user.is_moderator
            or self.request.user == conversation.customer
        ):
            # Update the conversation's last updated timestamp
            conversation.save()  # This triggers the auto_now field

            # Create the message
            message = serializer.save(
                conversation=conversation, sender=self.request.user
            )

            # Create notification for the recipient
            if self.request.user == conversation.customer:
                # If sender is customer, notify all staff assigned to this conversation
                assignments = StaffAssignment.objects.filter(conversation=conversation)
                for assignment in assignments:
                    Notification.objects.create(
                        user=assignment.staff,
                        notification_type=NotificationType.NEW_MESSAGE,
                        title="New message from customer",
                        message=f"New message in conversation: {conversation.subject}",
                        related_object_id=str(conversation.id),
                        is_read=False,
                    )
            else:
                # If sender is staff, notify the customer
                Notification.objects.create(
                    user=conversation.customer,
                    notification_type=NotificationType.NEW_MESSAGE,
                    title="New support message",
                    message=f"You have a new message in conversation: {conversation.subject}",
                    related_object_id=str(conversation.id),
                    is_read=False,
                )
        else:
            # Other users cannot add messages
            raise permissions.PermissionDenied(
                "You don't have permission to add messages to this conversation"
            )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None, conversation_pk=None):
        """
        Mark a message as read
        """
        message = self.get_object()

        # Only the recipient can mark a message as read
        if (
            request.user != message.conversation.customer
            and message.sender == message.conversation.customer
        ):
            message.is_read = True
            message.save()
        elif (
            request.user == message.conversation.customer
            and message.sender != message.conversation.customer
        ):
            message.is_read = True
            message.save()

        return Response({"status": "message marked as read"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request, conversation_pk=None):
        """
        Mark all messages in a conversation as read
        """
        conversation = get_object_or_404(Conversation, id=conversation_pk)

        # Check permissions
        if request.user.is_staff or request.user.is_moderator:
            # Staff mark all customer messages as read
            Message.objects.filter(
                conversation=conversation, sender=conversation.customer, is_read=False
            ).update(is_read=True)
        elif request.user == conversation.customer:
            # Customer marks all staff messages as read
            Message.objects.filter(conversation=conversation, is_read=False).exclude(
                sender=request.user
            ).update(is_read=True)

        return Response(
            {"status": "all messages marked as read"}, status=status.HTTP_200_OK
        )
