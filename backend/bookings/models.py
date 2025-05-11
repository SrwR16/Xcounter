from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from movies.models import Show
from users.models import CustomUser


# Create your models here.
class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"


class BookingStatus(models.TextChoices):
    RESERVED = "RESERVED", "Reserved"
    CONFIRMED = "CONFIRMED", "Confirmed"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"


class Booking(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="bookings"
    )
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name="bookings")
    booking_number = models.CharField(max_length=20, unique=True)
    total_seats = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    booking_status = models.CharField(
        max_length=10, choices=BookingStatus.choices, default=BookingStatus.RESERVED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    promotion_applied = models.BooleanField(default=False)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    payment_reference = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Booking {self.booking_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        # Generate a unique booking number if not provided
        if not self.booking_number:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            user_id = str(self.user.id).zfill(4)
            show_id = str(self.show.id).zfill(4)
            self.booking_number = f"BK-{timestamp}-{user_id}-{show_id}"

        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["booking_number"]),
            models.Index(fields=["user"]),
            models.Index(fields=["show"]),
            models.Index(fields=["booking_status"]),
            models.Index(fields=["payment_status"]),
        ]


class SeatCategory(models.TextChoices):
    STANDARD = "STANDARD", "Standard"
    PREMIUM = "PREMIUM", "Premium"
    VIP = "VIP", "VIP"


class Ticket(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="tickets"
    )
    seat_number = models.CharField(max_length=10)
    seat_category = models.CharField(
        max_length=10, choices=SeatCategory.choices, default=SeatCategory.STANDARD
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    qr_code = models.ImageField(upload_to="tickets/qr_codes/", blank=True, null=True)
    ticket_number = models.CharField(max_length=30, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket {self.ticket_number} - Seat {self.seat_number}"

    def save(self, *args, **kwargs):
        # Generate a unique ticket number if not provided
        if not self.ticket_number:
            booking_id = str(self.booking.id).zfill(6)
            seat = self.seat_number.replace(" ", "")
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            self.ticket_number = f"T-{booking_id}-{seat}-{timestamp}"

        super().save(*args, **kwargs)

    class Meta:
        unique_together = ("booking", "seat_number")
        indexes = [
            models.Index(fields=["ticket_number"]),
            models.Index(fields=["booking"]),
        ]
