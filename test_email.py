#!/usr/bin/env python
import os

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import necessary modules
from django.conf import settings
from django.core.mail import send_mail


def test_email_sending():
    subject = "Test Email from XCounter"
    message = "This is a test email from the XCounter application."
    html_message = """
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .header {
                background-color: #4a69bd;
                color: white;
                padding: 10px 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                padding: 20px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #777;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>XCounter</h1>
            </div>
            <div class="content">
                <h2>Test Email</h2>
                <p>This is a test email from the XCounter application.</p>
                <p>If you're receiving this email, it means that your email configuration is working correctly!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 XCounter. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = ["icount.bd@gmail.com"]  # Replace with the recipient email

    print(f"Sending email from: {from_email}")
    print(f"Sending email to: {recipient_list}")

    try:
        result = send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        print(f"Email sent successfully! Result: {result}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


if __name__ == "__main__":
    print("Testing email sending...")
    result = test_email_sending()
    print(f"Email test {'succeeded' if result else 'failed'}.")
