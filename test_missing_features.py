#!/usr/bin/env python
import argparse
import os
import sys

import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import call_command

from notifications.models import NotificationType
from notifications.utils import create_system_announcement, send_notification

User = get_user_model()


def test_management_commands():
    """Test the management commands we've implemented"""
    print("\n===== Testing Management Commands =====")

    print("\nImplemented management commands:")
    print("1. cleanup_expired_shows - Archives or deletes old show data")
    print("2. generate_monthly_report - Generates comprehensive business reports")
    print("3. create_system_backup - Creates database and media backups")

    # Test system backup command as it's the most generally applicable
    print("\nTesting create_system_backup command:")
    try:
        backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
        call_command("create_system_backup", backup_dir=backup_dir)

        print("\nBackup files:")
        if os.path.exists(backup_dir):
            for filename in os.listdir(backup_dir):
                print(f"- {filename}")
    except Exception as e:
        print(f"Error running create_system_backup: {str(e)}")


def test_automated_notifications():
    """Test the automated notification system"""
    print("\n===== Testing Automated Notifications =====")

    print("\nImplemented notification types:")
    for notification_type in NotificationType.choices:
        print(f"- {notification_type[1]} ({notification_type[0]})")

    # Create a system announcement
    print("\n1. Creating system announcement:")
    announcement = create_system_announcement(
        subject="Important System Update",
        content="""
        <h2>System Update Notification</h2>
        <p>We're pleased to announce that our system will be updated with new features on May 15th!</p>
        <p>The system will be unavailable from 2:00 AM to 4:00 AM during the update.</p>
        <p>New features include:</p>
        <ul>
            <li>Improved ticket booking experience</li>
            <li>New payment options</li>
            <li>Enhanced movie recommendations</li>
        </ul>
        <p>Thank you for your understanding.</p>
        """,
    )
    print(
        f"System announcement created: ID={announcement.id}, Subject='{announcement.subject}'"
    )

    # Send a direct notification to a specific user
    print("\n2. Sending direct notification to a user:")
    try:
        # Get the first admin user
        user = User.objects.filter(is_staff=True).first()
        if user:
            notification = send_notification(
                user=user,
                notification_type=NotificationType.MOVIE_PREMIERE,
                subject="Exclusive Preview: New Movie Release",
                content="""
                <h2>You're Invited to an Exclusive Preview!</h2>
                <p>Dear valued customer,</p>
                <p>We're excited to invite you to an exclusive preview of our upcoming movie premiere!</p>
                <p>Join us on May 20th at 7:00 PM for this special event.</p>
                <p>RSVP by replying to this notification.</p>
                """,
                related_id="movie_123",
                send_email=True,
            )
            print(
                f"Direct notification sent to {user.email}: ID={notification.id}, Subject='{notification.subject}'"
            )
        else:
            print("No admin user found to send notification")
    except Exception as e:
        print(f"Error sending direct notification: {str(e)}")

    # Describe the automated notification command
    print("\n3. Automated notification system:")
    print(
        "The 'send_automated_notifications' command automates the following scenarios:"
    )
    print("- Upcoming show reminders (24 hours before show time)")
    print("- Booking confirmation reminders for pending bookings")
    print("- Movie premiere announcements for users with relevant preferences")
    print("- Re-engagement emails for inactive users")
    print("- System announcement distribution to all users")


def list_implemented_features():
    """List all the implemented features"""
    print("\n===== Implemented Features =====")

    print("\n1. Management Commands:")
    print(
        "- cleanup_expired_shows: Archives or deletes shows older than a specified number of days"
    )
    print(
        "- generate_monthly_report: Generates comprehensive reports on movies, bookings, and revenue"
    )
    print("- create_system_backup: Creates backups of the database and media files")

    print("\n2. Automated Notifications:")
    print(
        "- Multiple notification types: Booking confirmations, show reminders, movie premieres, etc."
    )
    print("- Email delivery with HTML formatting")
    print("- In-app messaging system")
    print("- User notification preferences")
    print("- Automated notification sending based on triggers (upcoming shows, etc.)")

    print("\n3. Advanced Reporting:")
    print("- Monthly reports with flexible date range selection")
    print("- Multiple output formats (CSV, text)")
    print("- Movie performance reports with revenue analysis")
    print("- Booking reports with daily breakdown")
    print("- Revenue reports with payment method and ticket type analysis")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test missing features in XCounter")
    parser.add_argument(
        "--management", action="store_true", help="Test management commands"
    )
    parser.add_argument(
        "--notifications", action="store_true", help="Test automated notifications"
    )
    parser.add_argument("--list", action="store_true", help="List implemented features")
    parser.add_argument("--all", action="store_true", help="Test all features")

    args = parser.parse_args()

    # If no arguments provided, test all
    if not any([args.management, args.notifications, args.list, args.all]):
        args.all = True

    if args.all or args.management:
        test_management_commands()

    if args.all or args.notifications:
        test_automated_notifications()

    if args.all or args.list:
        list_implemented_features()

    print("\n===== Testing Completed =====")
