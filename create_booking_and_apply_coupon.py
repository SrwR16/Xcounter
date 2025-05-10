#!/usr/bin/env python
import os
import random
import string
from decimal import Decimal

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from django.utils import timezone

from bookings.models import Booking
from coupons.models import Coupon, CouponUsage
from movies.models import Show
from users.models import CustomUser


def generate_booking_number():
    now = timezone.now()
    random_part = "".join(random.choices(string.digits, k=4))
    return f"BK-{now.strftime('%Y%m%d%H%M%S')}-{random_part}"


def create_booking_and_apply_coupon():
    try:
        # Get a customer user
        customer = CustomUser.objects.get(email="customer@example.com")
        print(f"Found customer: {customer.email}")

        # Get an active show
        show = Show.objects.filter(is_active=True).first()
        if not show:
            print("No active shows found")
            return

        print(
            f"Using show: ID={show.id}, Movie={show.movie.title}, Theater={show.theater.name}"
        )

        # Create a new booking
        booking_number = generate_booking_number()
        booking = Booking.objects.create(
            user=customer,
            show=show,
            booking_number=booking_number,
            total_seats=2,
            total_amount=Decimal("100.00"),  # Use Decimal instead of float
            payment_status="PENDING",
            booking_status="RESERVED",
            payment_method="CREDIT_CARD",
        )
        print(
            f"Created new booking: ID={booking.id}, Number={booking.booking_number}, Amount=${booking.total_amount}"
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

        # Convert to Decimal for calculation
        total_amount = booking.total_amount
        discount_amount = booking.discount_amount
        final_amount = total_amount - discount_amount
        print(f"New total after discount: ${final_amount}")

        return booking
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    booking = create_booking_and_apply_coupon()
    if booking:
        print(f"Successfully created booking {booking.id} with coupon applied")
    else:
        print("Failed to create booking or apply coupon")
