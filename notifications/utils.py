import logging

from django.core.mail import EmailMessage

from .models import Notification, NotificationType, UserNotificationPreference

logger = logging.getLogger(__name__)


def create_notification(
    user, notification_type, subject, content, related_id=None, data=None
):
    """
    Create a notification for a user.

    Args:
        user: CustomUser instance
        notification_type: NotificationType choice
        subject: str - notification subject
        content: str - notification content (HTML)
        related_id: str - optional ID of related object
        data: dict - additional data to store with notification

    Returns:
        Notification instance or None if creation failed
    """
    try:
        # Get or create user notification preferences
        if user:
            preferences, created = UserNotificationPreference.objects.get_or_create(
                user=user
            )

        # Create notification
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            subject=subject,
            content=content,
            related_id=related_id,
            data=data,
        )

        return notification
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return None


def send_notification_email(notification):
    """
    Send an email notification.

    Args:
        notification: Notification instance

    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # System notifications don't have a user
        if not notification.user:
            logger.info("Cannot send email for system notification with no user")
            return False

        # Check if user has email notifications enabled
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=notification.user
        )

        # Check if user has this notification type enabled
        if (
            notification.notification_type == NotificationType.BOOKING_CONFIRMATION
            and not preferences.booking_confirmations
        ):
            return False
        elif (
            notification.notification_type == NotificationType.SHOW_REMINDER
            and not preferences.show_reminders
        ):
            return False
        elif (
            notification.notification_type == NotificationType.MOVIE_PREMIERE
            and not preferences.movie_premieres
        ):
            return False
        elif (
            notification.notification_type == NotificationType.PROMOTION
            and not preferences.promotions
        ):
            return False
        elif (
            notification.notification_type == NotificationType.SYSTEM_ANNOUNCEMENT
            and not preferences.system_announcements
        ):
            return False
        elif not preferences.email_enabled:
            logger.info(
                f"Email notifications disabled for user {notification.user.email}"
            )
            return False

        # Send email
        email = EmailMessage(
            subject=notification.subject,
            body=notification.content,
            to=[notification.user.email],
        )
        email.content_subtype = "html"  # Send as HTML
        sent = email.send()

        if sent:
            notification.is_email_sent = True
            notification.status = Notification.Status.SENT
            notification.save()
            return True
        else:
            notification.status = Notification.Status.FAILED
            notification.error_message = "Failed to send email"
            notification.save()
            return False
    except Exception as e:
        notification.status = Notification.Status.FAILED
        notification.error_message = str(e)
        notification.save()
        logger.error(f"Error sending email notification: {str(e)}")
        return False


def send_notification(
    user,
    notification_type,
    subject,
    content,
    related_id=None,
    data=None,
    send_email=True,
):
    """
    Create and send a notification to a user.

    Args:
        user: CustomUser instance
        notification_type: NotificationType choice
        subject: str - notification subject
        content: str - notification content (HTML)
        related_id: str - optional ID of related object
        data: dict - additional data to store with notification
        send_email: bool - whether to send an email for this notification

    Returns:
        Notification instance or None if creation failed
    """
    notification = create_notification(
        user, notification_type, subject, content, related_id, data
    )

    if notification:
        if send_email:
            send_notification_email(notification)
        else:
            # Just mark as sent for in-app only notifications
            notification.status = Notification.Status.SENT
            notification.save()

    return notification


def mark_notification_as_read(notification_id, user):
    """
    Mark a notification as read.

    Args:
        notification_id: ID of the notification
        user: CustomUser instance

    Returns:
        bool: True if marked successfully, False otherwise
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
        if not notification.is_read:
            notification.mark_as_read()
        return True
    except Notification.DoesNotExist:
        return False
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return False


def create_system_announcement(subject, content, data=None):
    """
    Create a system announcement notification template.
    This will be processed by the automated notification system to send to all users.

    Args:
        subject: str - notification subject
        content: str - notification content (HTML)
        data: dict - additional data to store with notification

    Returns:
        Notification instance or None if creation failed
    """
    try:
        # Create template notification with no user
        notification = Notification.objects.create(
            user=None,
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            subject=subject,
            content=content,
            data=data,
            status=Notification.Status.PENDING,
        )
        return notification
    except Exception as e:
        logger.error(f"Error creating system announcement: {str(e)}")
        return None
