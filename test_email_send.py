#!/usr/bin/env python
import os
import sys

import django
from django.conf import settings
from django.core.mail import EmailMessage

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()


def test_direct_email():
    """Send a test email directly without using the notification system."""
    try:
        # Email details
        subject = "Test Email from XCounter"
        body = """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #3498db;">Test Email</h2>
            <p>This is a direct test email from the XCounter application.</p>
            <p>If you're receiving this email, it means that your email configuration is working correctly!</p>
            <p>Email configuration:</p>
            <ul>
                <li>EMAIL_HOST: {host}</li>
                <li>EMAIL_PORT: {port}</li>
                <li>EMAIL_USE_TLS: {tls}</li>
                <li>EMAIL_HOST_USER: {user}</li>
                <li>EMAIL_BACKEND: {backend}</li>
            </ul>
            <p>Best regards,<br>The XCounter Team</p>
        </div>
        """.format(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            tls=settings.EMAIL_USE_TLS,
            user=settings.EMAIL_HOST_USER,
            backend=settings.EMAIL_BACKEND,
        )

        # Get the recipient
        if len(sys.argv) > 1:
            recipient = sys.argv[1]
        else:
            recipient = "admin@example.com"

        # Print config for debugging
        print("Email configuration:")
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        print(f"\nSending test email to: {recipient}")

        # Create and send the email
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        email.content_subtype = "html"  # Send as HTML

        # Send the email
        sent = email.send()

        if sent:
            print(f"Email sent successfully to {recipient}!")
            return True
        else:
            print(f"Failed to send email to {recipient}")
            return False
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


if __name__ == "__main__":
    result = test_direct_email()
    if result:
        print("Email test succeeded.")
    else:
        print("Email test failed.")
