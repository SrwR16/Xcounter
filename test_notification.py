#!/usr/bin/env python
import os
import sys

import django

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import models
from notifications.models import NotificationType, UserNotificationPreference
from notifications.utils import send_notification
from users.models import CustomUser


def create_notification_types():
    """Create default notification types."""
    from django.core.management import call_command

    call_command("create_notification_types")


def send_test_notification(email):
    """Send a test notification to a user."""
    try:
        user = CustomUser.objects.get(email=email)

        # Make sure notification preferences exist
        UserNotificationPreference.objects.get_or_create(user=user)

        # Check if we have notification types
        if NotificationType.objects.count() == 0:
            print("Creating notification types...")
            create_notification_types()

        # Send a test system announcement
        notification = send_notification(
            user=user,
            notification_type_name="SYSTEM_ANNOUNCEMENT",
            context_data={
                "subject": "Test Notification",
                "message": "<p>This is a test notification from the XCounter system.</p><p>If you are seeing this, the notification system is working correctly!</p>",
            },
        )

        if notification:
            print(f"Notification sent successfully to {email}!")
            print(f"Subject: {notification.subject}")
            print(f"Status: {notification.status}")
            print(f"Is email sent: {notification.is_email_sent}")
            return True
        else:
            print(f"Failed to send notification to {email}")
            return False
    except CustomUser.DoesNotExist:
        print(f"User with email {email} does not exist")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False


def main():
    # Check if an email was provided
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        # Default to admin if no email provided
        email = "admin@example.com"

    print(f"Sending test notification to: {email}")

    result = send_test_notification(email)
    if result:
        print("Notification test completed successfully")
    else:
        print("Notification test failed")


if __name__ == "__main__":
    main()
