import json

import requests

# Base URL for API
BASE_URL = "http://localhost:8000/api"

# Admin credentials
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

# Test user credentials
USER_EMAIL = "customer@example.com"
USER_PASSWORD = "customer123"


def print_response(response, label=None):
    """Print formatted API response"""
    if label:
        print(f"\n--- {label} ---")

    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print()


def login(email, password):
    """Login and get auth token"""
    response = requests.post(
        f"{BASE_URL}/users/login/", data={"email": email, "password": password}
    )

    if response.status_code == 200:
        return response.json().get("token")
    else:
        print_response(response, "Login Failed")
        return None


def get_headers(token=None):
    """Get headers with optional auth token"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Token {token}"
    return headers


def main():
    # Login as admin
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        print("Admin login failed. Exiting.")
        return

    # Login as customer
    user_token = login(USER_EMAIL, USER_PASSWORD)
    if not user_token:
        print("User login failed. Exiting.")
        return

    # List available shows
    response = requests.get(
        f"{BASE_URL}/movies/shows/", headers=get_headers(user_token)
    )

    if response.status_code != 200:
        print_response(response, "Failed to get shows")
        return

    shows = response.json().get("results", [])
    if not shows:
        print("No shows found. Exiting.")
        return

    # Use the first available show
    show_id = shows[0]["id"]
    print(f"Using show ID: {show_id}")

    # Get available seats
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/seats/",
        headers=get_headers(user_token),
        params={"show_id": show_id},
    )

    if response.status_code != 200:
        print_response(response, "Failed to get seats")
        return

    print_response(response, "Available Seats")
    seat_data = response.json()
    # Select 2 seats
    selected_seats = seat_data["available_seats"][:2]
    print(f"Selected seats: {selected_seats}")

    # Create a booking
    booking_data = {
        "show_id": show_id,
        "seat_numbers": selected_seats,
        "total_amount": 100.00,  # 2 seats at $50 each
        "payment_method": "CREDIT_CARD",
    }

    response = requests.post(
        f"{BASE_URL}/bookings/bookings/",
        headers=get_headers(user_token),
        json=booking_data,
    )

    if response.status_code != 201:
        print_response(response, "Failed to create booking")
        return

    print_response(response, "Created Booking")

    # Get bookings to find the ID
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/", headers=get_headers(user_token)
    )

    if response.status_code != 200:
        print_response(response, "Failed to get bookings")
        return

    bookings = response.json().get("results", [])
    if not bookings:
        print("No bookings found. Exiting.")
        return

    # Get the most recent booking
    booking_id = bookings[0]["id"]
    print(f"Using booking ID: {booking_id}")

    # Get available coupons
    response = requests.get(
        f"{BASE_URL}/coupons/coupons/", headers=get_headers(user_token)
    )

    if response.status_code != 200:
        print_response(response, "Failed to get coupons")
        return

    print_response(response, "Available Coupons")

    coupons = response.json().get("results", [])
    if not coupons:
        print("No coupons found. Exiting.")
        return

    # Use the first coupon
    coupon_code = coupons[0]["code"]
    print(f"Using coupon code: {coupon_code}")

    # Apply coupon to booking
    apply_data = {"code": coupon_code, "booking_id": booking_id}

    response = requests.post(
        f"{BASE_URL}/coupons/coupons/apply/",
        headers=get_headers(user_token),
        json=apply_data,
    )

    print_response(response, "Apply Coupon")

    # Check booking details after coupon
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/{booking_id}/", headers=get_headers(user_token)
    )

    print_response(response, "Booking After Coupon")

    # Confirm payment
    payment_data = {"transaction_id": "test_transaction_123"}

    response = requests.post(
        f"{BASE_URL}/bookings/bookings/{booking_id}/confirm_payment/",
        headers=get_headers(user_token),
        json=payment_data,
    )

    print_response(response, "Payment Confirmation")

    # Check customer profile for points
    response = requests.get(
        f"{BASE_URL}/promotions/customer-profiles/me/", headers=get_headers(user_token)
    )

    print_response(response, "Customer Profile")


if __name__ == "__main__":
    main()
