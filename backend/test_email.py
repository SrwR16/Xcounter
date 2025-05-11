#!/usr/bin/env python
import os
import sys

import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import Django components
from django.conf import settings
from django.core.mail import send_mail

from users.models import CustomUser, TwoFactorCode


def test_email():
    try:
        print("Email settings:")
        print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        # Check if EMAIL_HOST_PASSWORD is set
        if not settings.EMAIL_HOST_PASSWORD:
            print("WARNING: EMAIL_HOST_PASSWORD is not set!")
        else:
            print("EMAIL_HOST_PASSWORD is set (value hidden)")

        print("\nAttempting to send test email...")
        send_mail(
            "Test Email from XCounter",
            "This is a test email to verify the email configuration is working properly.",
            settings.DEFAULT_FROM_EMAIL,
            ["icount.bd@gmail.com"],
            fail_silently=False,
        )
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {type(e).__name__}: {str(e)}")


def test_2fa_code():
    try:
        print("\nAttempting to generate and send 2FA code...")
        # Get user with email icount.bd@gmail.com
        user = CustomUser.objects.get(email="icount.bd@gmail.com")
        print(f"Found user: {user.email} (ID: {user.id})")

        # Generate 2FA code
        code_obj = TwoFactorCode.generate_code(user)
        print(f"Generated code: {code_obj.code}")

        # Send email with code
        subject = "Your XCounter Two-Factor Authentication Test Code"
        message = f"""Hello {user.email},

Your two-factor authentication code is: {code_obj.code}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Regards,
The XCounter Team"""

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print("2FA code email sent successfully!")
    except CustomUser.DoesNotExist:
        print("User with email icount.bd@gmail.com not found")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {str(e)}")


if __name__ == "__main__":
    test_email()
    test_2fa_code()
