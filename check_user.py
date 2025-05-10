#!/usr/bin/env python
import os
import sys

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import User model
from users.models import CustomUser


def check_user(email):
    try:
        user = CustomUser.objects.get(email=email)
        print(f"User: {user.email}")
        print(f"Role: {user.role}")
        print(f"Email verified: {user.is_email_verified}")
        print(f"Active: {user.is_active}")
        print(f"Date joined: {user.date_joined}")

        # Check if profile exists
        if hasattr(user, "profile"):
            print("\nProfile:")
            print(f"Full name: {user.profile.full_name}")
            print(f"Phone: {user.profile.phone_number}")
            print(f"Address: {user.profile.address}")
            print(f"Employee ID: {user.profile.employee_id}")
        else:
            print("\nProfile: None")

    except CustomUser.DoesNotExist:
        print(f"User with email {email} does not exist.")
        return None

    return user


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_user.py <email>")
        sys.exit(1)

    email = sys.argv[1]
    check_user(email)
