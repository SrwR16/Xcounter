#!/usr/bin/env python
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from bookings.models import Booking
from coupons.models import Coupon, CouponUsage
from users.models import CustomUser


def apply_coupon_directly():
    try:
        # Get a customer user
        customer = CustomUser.objects.get(email="customer@example.com")
        print(f"Found customer: {customer.email}")

        # Get a specific booking
        booking_id = 13  # Use a specific booking ID
        try:
            booking = Booking.objects.get(id=booking_id, user=customer)
        except Booking.DoesNotExist:
            print(f"Booking with ID {booking_id} not found for this customer")
            return

        print(
            f"Using booking: ID={booking.id}, Number={booking.booking_number}, Status={booking.booking_status}, Amount=${booking.total_amount}"
        )

        # Get the FLAT10 coupon
        try:
            coupon = Coupon.objects.get(code="FLAT10")
            print(
                f"Found coupon: {coupon.code}, Type: {coupon.get_coupon_type_display()}, Value: {coupon.discount_value}"
            )
        except Coupon.DoesNotExist:
            print("FLAT10 coupon not found")
            return

        # Check if coupon is already applied to this booking
        if CouponUsage.objects.filter(coupon=coupon, booking=booking).exists():
            print("Coupon already applied to this booking")
            return

        # Calculate discount amount
        if coupon.coupon_type == "PERCENTAGE":
            discount = booking.total_amount * (coupon.discount_value / 100)
            if coupon.max_discount and discount > coupon.max_discount:
                discount = coupon.max_discount
        else:  # Fixed amount
            discount = coupon.discount_value
            if discount > booking.total_amount:
                discount = booking.total_amount

        print(f"Calculated discount amount: ${discount}")

        # Create coupon usage record
        usage = CouponUsage.objects.create(
            coupon=coupon,
            user=customer,
            booking=booking,
            discount_amount=discount,
        )
        print(f"Created coupon usage record: {usage.id}")

        # Update coupon usage count
        coupon.current_uses += 1
        coupon.save()
        print(f"Updated coupon usage count to {coupon.current_uses}")

        # Update booking with discount
        booking.discount_amount = discount
        booking.save()
        print(f"Updated booking with discount: ${booking.discount_amount}")
        print(
            f"New total after discount: ${booking.total_amount - booking.discount_amount}"
        )

        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    result = apply_coupon_directly()
    print(f"Coupon application {'succeeded' if result else 'failed'}")
