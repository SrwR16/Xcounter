#!/usr/bin/env python
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from bookings.models import Booking
from users.models import CustomUser


def check_bookings():
    try:
        customer = CustomUser.objects.get(email="customer@example.com")
        print(f"Found customer: {customer.email}")

        bookings = Booking.objects.filter(user=customer).order_by("-id")[:5]

        if not bookings:
            print("No bookings found for this customer")
            return

        print(f"\nRecent bookings for {customer.email}:")
        print("-" * 100)
        print(
            f"{'ID':<5} | {'Booking Number':<30} | {'Status':<15} | {'Show ID':<7} | {'Total':>8} | {'Discount':>8}"
        )
        print("-" * 100)

        for b in bookings:
            status = getattr(b, "booking_status", "UNKNOWN")
            print(
                f"{b.id:<5} | {b.booking_number:<30} | {status:<15} | {b.show_id:<7} | ${b.total_amount:>7.2f} | ${b.discount_amount or 0:>7.2f}"
            )

    except CustomUser.DoesNotExist:
        print("Customer with email 'customer@example.com' not found")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_bookings()
