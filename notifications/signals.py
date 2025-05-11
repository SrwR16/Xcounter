from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from bookings.models import Booking
from promotions.models import Promotion

from .utils import send_notification


@receiver(post_save, sender=Booking)
def handle_booking_notification(sender, instance, created, **kwargs):
    """
    Send notifications when a booking is created or its status changes.
    """
    # Only proceed if the booking has a user
    if not instance.user:
        return

    # Send booking confirmation when a new booking is created
    if created and instance.status == "CONFIRMED":
        send_notification(
            user=instance.user,
            notification_type_name="BOOKING_CONFIRMATION",
            context_data={
                "booking": instance,
            },
        )

    # Send cancellation notification when a booking is cancelled
    elif not created and instance.status == "CANCELLED":
        send_notification(
            user=instance.user,
            notification_type_name="BOOKING_CANCELLED",
            context_data={
                "booking": instance,
                "refund_amount": instance.total_amount,  # This should be calculated properly
            },
        )


@receiver(post_save, sender=Promotion)
def handle_promotion_notification(sender, instance, created, **kwargs):
    """
    Send notifications when a new promotion is created.
    """
    # Only send notifications for new, active promotions
    if created and instance.is_active:
        # Get all users who have opted in for promotion notifications
        from users.models import CustomUser

        from .models import UserNotificationPreference

        # Find users who have opted in for promotions
        promotion_users = UserNotificationPreference.objects.filter(
            promotions=True
        ).values_list("user", flat=True)

        users = CustomUser.objects.filter(id__in=promotion_users, is_active=True)

        # Send notification to each eligible user
        for user in users:
            send_notification(
                user=user,
                notification_type_name="NEW_PROMOTION",
                context_data={
                    "promotion": instance,
                    "coupon_code": instance.coupon.code
                    if hasattr(instance, "coupon") and instance.coupon
                    else None,
                },
            )


# Function to schedule reminders for upcoming bookings
def schedule_booking_reminders():
    """
    Schedule reminders for bookings that are coming up soon.
    This should be run by a scheduled task (e.g., Celery).
    """
    from datetime import timedelta

    # Find bookings that start in 2 hours
    reminder_time = timezone.now() + timedelta(hours=2)
    upcoming_bookings = Booking.objects.filter(
        show__start_time__gte=reminder_time,
        show__start_time__lte=reminder_time + timedelta(minutes=10),
        status="CONFIRMED",
    )

    for booking in upcoming_bookings:
        send_notification(
            user=booking.user,
            notification_type_name="BOOKING_REMINDER",
            context_data={
                "booking": booking,
            },
        )
