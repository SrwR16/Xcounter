#!/usr/bin/env python
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from django.utils import timezone

from bookings.models import Booking
from coupons.models import Coupon
from coupons.views import CouponViewSet
from users.models import CustomUser


def test_coupon_directly():
    try:
        # Get a customer user
        customer = CustomUser.objects.get(email="customer@example.com")
        print(f"Found customer: {customer.email}")

        # Get a booking
        booking = Booking.objects.filter(user=customer).order_by("-id").first()
        if not booking:
            print("No bookings found for this customer")
            return

        print(f"Using booking: ID={booking.id}, Amount=${booking.total_amount}")

        # Get the FLAT10 coupon
        try:
            coupon = Coupon.objects.get(code="FLAT10")
            print(
                f"Found coupon: {coupon.code}, Type: {coupon.get_coupon_type_display()}, Value: {coupon.discount_value}"
            )
        except Coupon.DoesNotExist:
            print("FLAT10 coupon not found")
            return

        # Check if coupon is valid
        now = timezone.now()
        is_valid = (
            coupon.is_active
            and coupon.valid_from <= now <= coupon.valid_to
            and (coupon.max_uses == 0 or coupon.current_uses < coupon.max_uses)
        )
        print(f"Coupon is valid: {is_valid}")
        print(
            f"Active: {coupon.is_active}, Valid period: {coupon.valid_from} to {coupon.valid_to}"
        )
        print(f"Current uses: {coupon.current_uses}, Max uses: {coupon.max_uses}")

        # Calculate discount directly
        viewset = CouponViewSet()
        try:
            discount_info = viewset._calculate_discount_info(coupon, booking)
            print(f"Discount calculation successful: {discount_info}")
        except Exception as e:
            print(f"Error calculating discount: {e}")
            return

        # Apply discount manually for testing
        discount_amount = discount_info["discount_amount"]
        print(f"Discount amount: ${discount_amount}")
        print(f"Original total: ${booking.total_amount}")
        print(f"New total after discount: ${booking.total_amount - discount_amount}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_coupon_directly()
