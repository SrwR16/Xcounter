#!/usr/bin/env python
"""
Test script for the VIP Reservation feature in the Movie Counter application.
This script demonstrates how admins can create special VIP reservations.
"""

import json
import sys

import requests

# Base URL - adjust as needed
BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"
VIP_USER_EMAIL = "vip@example.com"


# Helper functions
def print_step(message):
    """Print a step in the test process with formatting."""
    print(f"\n{'=' * 80}")
    print(f"STEP: {message}")
    print(f"{'=' * 80}\n")


def print_response(response, description):
    """Print the response with formatting."""
    print(f"\n{description}")
    print(f"Status Code: {response.status_code}")
    if hasattr(response, "json"):
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"Response: {response.text}")
    print("-" * 50)


def login_admin():
    """Log in as an admin and return the access token."""
    print_step("Logging in as admin")
    login_url = f"{BASE_URL}/users/login/"
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = requests.post(login_url, json=login_data)
    print_response(response, "Admin Login")

    if response.status_code != 200:
        print("Failed to log in as admin. Exiting.")
        sys.exit(1)

    return response.json()["access"]


def get_active_show(token):
    """Get an active show for testing."""
    print_step("Getting an active show")
    headers = {"Authorization": f"Bearer {token}"}
    shows_url = f"{BASE_URL}/movies/shows/"
    response = requests.get(shows_url, headers=headers)
    print_response(response, "Get Shows")

    if response.status_code != 200 or len(response.json()) == 0:
        print("No shows found or error retrieving shows. Exiting.")
        sys.exit(1)

    # Get the first active show
    for show in response.json():
        if show["is_active"]:
            return show["id"]

    print("No active shows found. Exiting.")
    sys.exit(1)


def create_vip_reservation(token, show_id):
    """Create a VIP reservation."""
    print_step("Creating VIP reservation")
    headers = {"Authorization": f"Bearer {token}"}
    vip_url = f"{BASE_URL}/bookings/vip_reservation/"

    vip_data = {
        "show_id": show_id,
        "user_email": VIP_USER_EMAIL,
        "seat_numbers": ["A1", "A2"],
        "total_amount": 199.99,
        "notes": "VIP guest - provide special treatment",
    }

    response = requests.post(vip_url, json=vip_data, headers=headers)
    print_response(response, "VIP Reservation")

    if response.status_code != 201:
        print("Failed to create VIP reservation. Exiting.")
        sys.exit(1)

    return response.json()["id"]


def get_vip_tickets(token):
    """Get all VIP tickets."""
    print_step("Getting all VIP tickets")
    headers = {"Authorization": f"Bearer {token}"}
    vip_tickets_url = f"{BASE_URL}/tickets/vip_tickets/"

    response = requests.get(vip_tickets_url, headers=headers)
    print_response(response, "VIP Tickets")

    if response.status_code != 200:
        print("Failed to retrieve VIP tickets. Exiting.")
        sys.exit(1)


def main():
    """Main test function."""
    print("\n🎬 TESTING VIP RESERVATION FEATURE 🎬\n")

    # 1. Login as admin
    token = login_admin()

    # 2. Get an active show
    show_id = get_active_show(token)

    # 3. Create a VIP reservation
    booking_id = create_vip_reservation(token, show_id)

    # 4. View all VIP tickets
    get_vip_tickets(token)

    print("\n✅ VIP RESERVATION TEST COMPLETED SUCCESSFULLY ✅\n")
    print("The test has demonstrated the following:")
    print("1. Admin authentication")
    print("2. Retrieving an active show")
    print("3. Creating a VIP reservation for a VIP user")
    print("4. Retrieving all VIP tickets")


if __name__ == "__main__":
    main()
