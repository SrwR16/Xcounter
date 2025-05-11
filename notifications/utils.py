import logging

from django.core.mail import EmailMessage
from django.template import Context, Template
from django.utils import timezone

from .models import Notification, NotificationType, UserNotificationPreference

logger = logging.getLogger(__name__)


def render_template(template_string, context_data):
    """
    Render a Django template with the provided context data.
    """
    template = Template(template_string)
    context = Context(context_data)
    return template.render(context)


def create_notification(user, notification_type_name, context_data=None):
    """
    Create a notification for a user.

    Args:
        user: CustomUser instance
        notification_type_name: str - name of the notification type
        context_data: dict - data to render in the template

    Returns:
        Notification instance or None if creation failed
    """
    try:
        # Get the notification type
        notification_type = NotificationType.objects.get(
            name=notification_type_name, is_active=True
        )

        # Get or create user notification preferences
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=user
        )

        # Prepare context data
        if context_data is None:
            context_data = {}

        # Create a copy to avoid modifying the original
        template_context = context_data.copy()

        # Add user and timestamp to the template context (not stored in JSON)
        template_context.update(
            {
                "user": user,
                "timestamp": timezone.now(),
            }
        )

        # Render templates
        subject = render_template(notification_type.template_subject, template_context)
        content = render_template(notification_type.template_content, template_context)

        # Store only JSON-serializable data
        json_data = {}
        for key, value in context_data.items():
            # Skip non-serializable objects
            if not isinstance(value, (dict, list, str, int, float, bool, type(None))):
                continue
            json_data[key] = value

        # Create notification
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            subject=subject,
            content=content,
            data=json_data,
        )

        return notification
    except NotificationType.DoesNotExist:
        logger.error(f"Notification type '{notification_type_name}' not found")
        return None
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return None


def send_email_notification(notification):
    """
    Send an email notification.

    Args:
        notification: Notification instance

    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # Check if user has email notifications enabled
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=notification.user
        )

        if not preferences.email_enabled:
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


def send_notification(user, notification_type_name, context_data=None):
    """
    Create and send a notification to a user.

    Args:
        user: CustomUser instance
        notification_type_name: str - name of the notification type
        context_data: dict - data to render in the template

    Returns:
        Notification instance or None if creation failed
    """
    notification = create_notification(user, notification_type_name, context_data)

    if notification:
        # Check if notification type requires email
        if notification.notification_type.requires_email:
            send_email_notification(notification)
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
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        return True
    except Notification.DoesNotExist:
        return False
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return False
