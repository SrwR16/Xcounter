import random
import string

from django.conf import settings
from django.db import models
from django.utils import timezone


class CouponType(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", "Percentage Discount"
    FIXED = "FIXED", "Fixed Amount Discount"


class CouponApplicability(models.TextChoices):
    ALL = "ALL", "All Movies & Shows"
    SPECIFIC_MOVIES = "SPECIFIC_MOVIES", "Specific Movies"
    SPECIFIC_THEATERS = "SPECIFIC_THEATERS", "Specific Theaters"
    SPECIFIC_SHOWS = "SPECIFIC_SHOWS", "Specific Shows"


class Coupon(models.Model):
    """
    Model for storing coupon details
    """

    code = models.CharField(max_length=20, unique=True)
    description = models.TextField()

    # Discount information
    coupon_type = models.CharField(
        max_length=20, choices=CouponType.choices, default=CouponType.PERCENTAGE
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage or fixed amount depending on coupon type",
    )
    max_discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Maximum discount amount for percentage coupons",
    )
    min_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Minimum purchase amount required",
    )

    # Applicability
    applicability = models.CharField(
        max_length=20,
        choices=CouponApplicability.choices,
        default=CouponApplicability.ALL,
    )
    applicable_movies = models.ManyToManyField(
        "movies.Movie", blank=True, related_name="applicable_coupons"
    )
    applicable_theaters = models.ManyToManyField(
        "movies.Theater", blank=True, related_name="applicable_coupons"
    )
    applicable_shows = models.ManyToManyField(
        "movies.Show", blank=True, related_name="applicable_coupons"
    )

    # Validity
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    # Usage limits
    max_uses = models.IntegerField(default=0, help_text="0 means unlimited")
    max_uses_per_user = models.IntegerField(default=1, help_text="0 means unlimited")
    current_uses = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.code

    def is_valid(self):
        """Check if coupon is valid at current time"""
        now = timezone.now()
        return (
            self.is_active
            and self.valid_from <= now <= self.valid_to
            and (self.max_uses == 0 or self.current_uses < self.max_uses)
        )

    @staticmethod
    def generate_code(length=8, prefix=""):
        """Generate a unique coupon code"""
        chars = string.ascii_uppercase + string.digits
        while True:
            code = prefix + "".join(random.choice(chars) for _ in range(length))
            if not Coupon.objects.filter(code=code).exists():
                return code


class CouponUsage(models.Model):
    """
    Model for recording coupon usage
    """

    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="usages")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coupon_usages"
    )
    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_usages",
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.coupon.code} - {self.user.email}"
