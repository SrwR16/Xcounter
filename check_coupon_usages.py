#!/usr/bin/env python
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from bookings.models import Booking
from coupons.models import Coupon, CouponUsage


def check_coupon_usages():
    try:
        usages = CouponUsage.objects.all()
        print(f"Total coupon usages: {usages.count()}")

        for u in usages:
            print(
                f"Coupon: {u.coupon.code}, Booking ID: {u.booking_id}, User: {u.user.email}, Discount: ${u.discount_amount}"
            )

        # Check bookings with discounts
        bookings_with_discount = Booking.objects.filter(discount_amount__gt=0)
        print(f"\nBookings with discounts: {bookings_with_discount.count()}")

        for b in bookings_with_discount:
            print(
                f"Booking ID: {b.id}, Number: {b.booking_number}, User: {b.user.email}, Discount: ${b.discount_amount}"
            )

        # Check if there are any bookings without coupon usage records but with discounts
        for b in bookings_with_discount:
            usage_exists = CouponUsage.objects.filter(booking=b).exists()
            if not usage_exists:
                print(
                    f"WARNING: Booking {b.id} has discount ${b.discount_amount} but no coupon usage record"
                )

        # Check FLAT10 coupon
        try:
            coupon = Coupon.objects.get(code="FLAT10")
            print(
                f"\nFLAT10 coupon: Uses={coupon.current_uses}, Max uses={coupon.max_uses}"
            )
        except Coupon.DoesNotExist:
            print("\nFLAT10 coupon not found")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_coupon_usages()
