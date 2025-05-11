#!/usr/bin/env python
import os
import sys

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import necessary modules
from django.contrib.auth import get_user_model
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from users.tokens import email_verification_token

User = get_user_model()


def generate_verification_url(user_email):
    # Get the user
    try:
        user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        print(f"User with email {user_email} does not exist.")
        return None

    # Generate uidb64 and token
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    # Construct verification URL
    verification_url = f"http://localhost:8000/api/auth/verify-email/{uidb64}/{token}/"

    return verification_url


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_verification.py <user_email>")
        sys.exit(1)

    user_email = sys.argv[1]
    verification_url = generate_verification_url(user_email)

    if verification_url:
        print(f"Email verification URL for {user_email}:")
        print(verification_url)
        print("\nYou can use this URL to verify the user's email address.")
