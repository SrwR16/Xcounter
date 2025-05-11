import datetime
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


def create_test_data(admin_token):
    """Create test movie, theater and show data for testing"""
    # Create a movie
    movie_data = {
        "title": "Test Movie for Coupon",
        "description": "A test movie to test the coupon system",
        "release_date": "2025-05-10",
        "duration_minutes": 120,
        "rating": 8.5,
        "is_active": True,
    }

    response = requests.post(
        f"{BASE_URL}/movies/movies/", headers=get_headers(admin_token), json=movie_data
    )

    if response.status_code != 201:
        print_response(response, "Failed to create movie")
        return None, None, None

    movie_id = response.json()["id"]

    # Create a theater
    theater_data = {
        "name": "Test Theater",
        "location": "Test Location",
        "capacity": 100,
        "is_active": True,
    }

    response = requests.post(
        f"{BASE_URL}/movies/theaters/",
        headers=get_headers(admin_token),
        json=theater_data,
    )

    if response.status_code != 201:
        print_response(response, "Failed to create theater")
        return movie_id, None, None

    theater_id = response.json()["id"]

    # Create a show
    now = datetime.datetime.now()
    show_start = now + datetime.timedelta(hours=1)
    show_end = now + datetime.timedelta(hours=3)

    show_data = {
        "movie_id": movie_id,
        "theater_id": theater_id,
        "start_time": show_start.strftime("%Y-%m-%dT%H:%M:%S"),
        "end_time": show_end.strftime("%Y-%m-%dT%H:%M:%S"),
        "price": 50.00,
        "show_type": "3D",
        "total_seats": 100,
        "available_seats": 100,
        "is_active": True,
    }

    response = requests.post(
        f"{BASE_URL}/movies/shows/", headers=get_headers(admin_token), json=show_data
    )

    if response.status_code != 201:
        print_response(response, "Failed to create show")
        return movie_id, theater_id, None

    print_response(response, "Created Show")
    return movie_id, theater_id, response.json()["id"]


def test_booking_with_coupon(token, show_id):
    """Test creating a booking with a coupon"""
    print("\n=== TESTING BOOKING WITH COUPON ===")

    # Get available seats
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/seats/",
        headers=get_headers(token),
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
        f"{BASE_URL}/bookings/bookings/", headers=get_headers(token), json=booking_data
    )

    if response.status_code != 201:
        print_response(response, "Failed to create booking")
        return

    print_response(response, "Created Booking")

    # Response might not include the ID directly, let's get it from the list
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/", headers=get_headers(token)
    )

    if response.status_code != 200:
        print_response(response, "Failed to get bookings")
        return

    bookings = response.json().get("results", [])
    if not bookings:
        print("No bookings found")
        return

    # Get the most recent booking (should be the one we just created)
    booking_id = bookings[0]["id"]
    print(f"Using booking ID: {booking_id}")

    # Get valid coupons
    response = requests.get(
        f"{BASE_URL}/coupons/coupons/",
        headers=get_headers(token),
    )

    if response.status_code != 200:
        print_response(response, "Failed to get coupons")
        return

    # Find the FLAT10 coupon
    welcome_coupon = None
    for coupon in response.json().get("results", []):
        if coupon["code"] == "FLAT10" and coupon["is_valid"]:
            welcome_coupon = coupon
            break

    if not welcome_coupon:
        print("FLAT10 coupon not found or not valid")
        return

    # Use the FLAT10 coupon
    coupon = welcome_coupon
    print(f"Using coupon: {coupon['code']}")

    # Apply the coupon to the booking
    apply_data = {"code": coupon["code"], "booking_id": booking_id}

    response = requests.post(
        f"{BASE_URL}/coupons/coupons/apply/",
        headers=get_headers(token),
        json=apply_data,
    )

    print_response(response, "Apply Coupon")

    if response.status_code != 200:
        return

    discount_amount = response.json().get("discount_amount", 0)

    # Check the updated booking to confirm the discount
    response = requests.get(
        f"{BASE_URL}/bookings/bookings/{booking_id}/",
        headers=get_headers(token),
    )

    print_response(response, "Updated Booking")

    # Complete the booking payment
    response = requests.post(
        f"{BASE_URL}/bookings/bookings/{booking_id}/confirm_payment/",
        headers=get_headers(token),
        json={"transaction_id": "test_transaction_123"},
    )

    print_response(response, "Payment Confirmation")

    # Check customer profile for points
    response = requests.get(
        f"{BASE_URL}/promotions/customer-profiles/me/",
        headers=get_headers(token),
    )

    print_response(response, "Updated Customer Profile")


def main():
    """Main test function"""
    # Login as admin to create test data
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        print("Admin login failed. Exiting.")
        return

    # Login as user for booking
    user_token = login(USER_EMAIL, USER_PASSWORD)
    if not user_token:
        print("User login failed. Exiting.")
        return

    # Create test data (movie, theater, show) as admin
    movie_id, theater_id, show_id = create_test_data(admin_token)
    if not show_id:
        print("Failed to create test data. Exiting.")
        return

    # Test booking with coupon as user
    test_booking_with_coupon(user_token, show_id)


if __name__ == "__main__":
    main()
