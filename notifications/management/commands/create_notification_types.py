from django.core.management.base import BaseCommand

from notifications.models import NotificationType


class Command(BaseCommand):
    help = "Create default notification types"

    def handle(self, *args, **options):
        notification_types = [
            {
                "name": "BOOKING_CONFIRMATION",
                "description": "Sent when a booking is confirmed",
                "template_subject": "Your booking #{{ booking.booking_number }} has been confirmed",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #3498db;">Booking Confirmation</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>Your booking has been confirmed. Here are the details:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Booking Number:</strong> {{ booking.booking_number }}</p>
                        <p><strong>Movie:</strong> {{ booking.show.movie.title }}</p>
                        <p><strong>Date & Time:</strong> {{ booking.show.start_time|date:"F d, Y - h:i A" }}</p>
                        <p><strong>Theater:</strong> {{ booking.show.theater.name }}</p>
                        <p><strong>Seats:</strong> {{ booking.seats_display }}</p>
                        <p><strong>Total Amount:</strong> ${{ booking.total_amount }}</p>
                    </div>
                    <p>Thank you for choosing XCounter. Enjoy your movie!</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
            {
                "name": "BOOKING_REMINDER",
                "description": "Sent as a reminder before a show",
                "template_subject": "Reminder: Your movie starts soon!",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #3498db;">Movie Reminder</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>This is a friendly reminder that your movie starts in 2 hours:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Movie:</strong> {{ booking.show.movie.title }}</p>
                        <p><strong>Date & Time:</strong> {{ booking.show.start_time|date:"F d, Y - h:i A" }}</p>
                        <p><strong>Theater:</strong> {{ booking.show.theater.name }}</p>
                        <p><strong>Booking Number:</strong> {{ booking.booking_number }}</p>
                    </div>
                    <p>We recommend arriving at least 15 minutes before the show starts.</p>
                    <p>Enjoy your movie!</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
            {
                "name": "BOOKING_CANCELLED",
                "description": "Sent when a booking is cancelled",
                "template_subject": "Your booking #{{ booking.booking_number }} has been cancelled",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #e74c3c;">Booking Cancelled</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>Your booking has been cancelled as requested. Here are the details:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Booking Number:</strong> {{ booking.booking_number }}</p>
                        <p><strong>Movie:</strong> {{ booking.show.movie.title }}</p>
                        <p><strong>Date & Time:</strong> {{ booking.show.start_time|date:"F d, Y - h:i A" }}</p>
                        <p><strong>Refund Amount:</strong> ${{ booking.refund_amount }}</p>
                    </div>
                    <p>If you have any questions about your refund, please contact our customer support.</p>
                    <p>Thank you for choosing XCounter.</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
            {
                "name": "NEW_PROMOTION",
                "description": "Sent when a new promotion is available",
                "template_subject": "New Promotion: {{ promotion.name }}",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #9b59b6;">New Promotion</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>We're excited to share a new promotion with you!</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #9b59b6; margin-top: 0;">{{ promotion.name }}</h3>
                        <p>{{ promotion.description }}</p>
                        {% if promotion.coupon_code %}
                        <p><strong>Use code:</strong> <span style="background-color: #9b59b6; color: white; padding: 5px 10px; border-radius: 3px;">{{ promotion.coupon_code }}</span></p>
                        {% endif %}
                        <p><strong>Valid until:</strong> {{ promotion.end_date|date:"F d, Y" }}</p>
                    </div>
                    <p>Don't miss out on this special offer!</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
            {
                "name": "SYSTEM_ANNOUNCEMENT",
                "description": "General system announcements",
                "template_subject": "{{ subject }}",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">{{ subject }}</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        {{ message|safe }}
                    </div>
                    <p>Thank you for being a valued customer of XCounter.</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
            {
                "name": "PASSWORD_RESET",
                "description": "Sent when a user requests a password reset",
                "template_subject": "Reset your XCounter password",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Password Reset</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="{{ reset_link }}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you didn't request a password reset, you can ignore this email or contact our support team if you have concerns.</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": False,
            },
            {
                "name": "WELCOME",
                "description": "Sent when a new user registers",
                "template_subject": "Welcome to XCounter!",
                "template_content": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #27ae60;">Welcome to XCounter!</h2>
                    <p>Dear {{ user.get_full_name|default:user.email }},</p>
                    <p>Thank you for joining XCounter, your one-stop solution for booking movie tickets!</p>
                    <p>With your new account, you can:</p>
                    <ul style="list-style-type: none; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">✅ Book tickets for the latest movies</li>
                        <li style="margin-bottom: 10px;">✅ Manage your bookings in one place</li>
                        <li style="margin-bottom: 10px;">✅ Receive special offers and discounts</li>
                        <li style="margin-bottom: 10px;">✅ Earn loyalty points for every booking</li>
                    </ul>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="{{ login_link }}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Booking</a>
                    </div>
                    <p>We're excited to have you with us!</p>
                    <p>Best regards,<br>The XCounter Team</p>
                </div>
                """,
                "requires_email": True,
                "requires_inapp": True,
            },
        ]

        for nt_data in notification_types:
            NotificationType.objects.update_or_create(
                name=nt_data["name"],
                defaults={
                    "description": nt_data["description"],
                    "template_subject": nt_data["template_subject"],
                    "template_content": nt_data["template_content"],
                    "requires_email": nt_data["requires_email"],
                    "requires_inapp": nt_data["requires_inapp"],
                    "is_active": True,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created {len(notification_types)} notification types"
            )
        )
