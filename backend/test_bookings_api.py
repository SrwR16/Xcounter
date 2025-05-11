import json
from datetime import datetime, timedelta

import requests

# Base URL
BASE_URL = "http://localhost:8000/api"
API_URL = f"{BASE_URL}/bookings"


# Helper functions
def print_response(response):
    print(f"Status Code: {response.status_code}")
    if hasattr(response, "json"):
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"Response: {response.text}")
    print("-" * 50)


def login(username="admin1@gmail.com", password="admin1"):
    """Login and return the authentication token"""
    login_url = f"{BASE_URL}/users/login/"
    login_data = {"email": username, "password": password}
    response = requests.post(login_url, json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"\nLogged in as {username}")
        print(f"Token: {token}")
        return token
    else:
        print(f"Login failed: {response.text}")
        return None


def headers_with_token(token):
    """Return headers with authorization token"""
    return {"Authorization": f"Token {token}", "Content-Type": "application/json"}


def create_test_show(token):
    """Create a test movie, theater, and show for booking tests"""
    # Create a genre
    genre_url = f"{BASE_URL}/movies/genres/"
    genre_data = {
        "name": f"Test Genre {datetime.now().timestamp()}",
        "description": "Test genre for booking tests",
    }
    response = requests.post(
        genre_url, json=genre_data, headers=headers_with_token(token)
    )
    if response.status_code == 201:
        genre_id = response.json().get("id")
    else:
        # Get an existing genre
        response = requests.get(genre_url)
        genres = response.json().get("results", [])
        genre_id = genres[0]["id"] if genres else None
        if not genre_id:
            raise Exception("No genres found")

    # Create a movie
    movie_url = f"{BASE_URL}/movies/movies/"
    movie_data = {
        "title": f"Test Movie {datetime.now().timestamp()}",
        "description": "Test movie for booking tests",
        "release_date": datetime.now().strftime("%Y-%m-%d"),
        "duration_minutes": 120,
        "genre_ids": [genre_id],
        "director": "Test Director",
        "cast": "Test Actor, Test Actress",
        "rating": 8.0,
    }
    response = requests.post(
        movie_url, json=movie_data, headers=headers_with_token(token)
    )
    if response.status_code == 201:
        movie_id = response.json().get("id")
    else:
        # Get an existing movie
        response = requests.get(movie_url)
        movies = response.json().get("results", [])
        movie_id = movies[0]["id"] if movies else None
        if not movie_id:
            raise Exception("No movies found")

    # Create a theater
    theater_url = f"{BASE_URL}/movies/theaters/"
    theater_data = {
        "name": f"Test Theater {datetime.now().timestamp()}",
        "location": "Test Location",
        "capacity": 200,
        "description": "Test theater for booking tests",
    }
    response = requests.post(
        theater_url, json=theater_data, headers=headers_with_token(token)
    )
    if response.status_code == 201:
        theater_id = response.json().get("id")
    else:
        # Get an existing theater
        response = requests.get(theater_url)
        theaters = response.json().get("results", [])
        theater_id = theaters[0]["id"] if theaters else None
        if not theater_id:
            raise Exception("No theaters found")

    # Create a show
    show_url = f"{BASE_URL}/movies/shows/"
    start_time = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S")
    end_time = (datetime.now() + timedelta(days=1, hours=2)).strftime(
        "%Y-%m-%dT%H:%M:%S"
    )
    show_data = {
        "movie_id": movie_id,
        "theater_id": theater_id,
        "start_time": start_time,
        "end_time": end_time,
        "price": 12.99,
        "show_type": "REGULAR",
        "total_seats": 100,
    }
    response = requests.post(
        show_url, json=show_data, headers=headers_with_token(token)
    )
    if response.status_code == 201:
        show_id = response.json().get("id")
        return show_id
    else:
        # Get an existing show
        response = requests.get(show_url)
        shows = response.json().get("results", [])
        show_id = shows[0]["id"] if shows else None
        if not show_id:
            raise Exception("No shows found")
        return show_id


def test_bookings(token, show_id):
    print("\nTESTING BOOKING APIs")

    # Create a booking
    create_url = f"{API_URL}/bookings/"
    booking_data = {
        "show_id": show_id,
        "seat_numbers": ["A1", "A2", "A3"],
        "total_amount": 38.97,  # 3 seats * $12.99
        "payment_method": "Credit Card",
    }
    response = requests.post(
        create_url, json=booking_data, headers=headers_with_token(token)
    )
    print("Create Booking:")
    print_response(response)

    # Get the booking ID from the list endpoint since create doesn't return full object
    list_url = f"{API_URL}/bookings/"
    response = requests.get(list_url, headers=headers_with_token(token))
    print("List Bookings:")
    print_response(response)

    # Get the booking ID from the list response
    if response.status_code == 200:
        bookings = response.json().get("results", [])
        booking_id = bookings[0]["id"] if bookings else None
        if not booking_id:
            print("No bookings found. Cannot continue tests.")
            return None
    else:
        print("Could not list bookings. Cannot continue tests.")
        return None

    # View booking details
    detail_url = f"{API_URL}/bookings/{booking_id}/"
    response = requests.get(detail_url, headers=headers_with_token(token))
    print(f"Get Booking Details ({booking_id}):")
    print_response(response)

    # Get active bookings
    active_url = f"{API_URL}/bookings/active/"
    response = requests.get(active_url, headers=headers_with_token(token))
    print("Active Bookings:")
    print_response(response)

    # Confirm payment
    confirm_url = f"{API_URL}/bookings/{booking_id}/confirm_payment/"
    confirm_data = {"payment_reference": "TEST-PAYMENT-123456"}
    response = requests.post(
        confirm_url, json=confirm_data, headers=headers_with_token(token)
    )
    print("Confirm Payment:")
    print_response(response)

    return booking_id


def test_tickets(token, booking_id):
    print("\nTESTING TICKET APIs")

    # List tickets
    list_url = f"{API_URL}/tickets/"
    response = requests.get(list_url, headers=headers_with_token(token))
    print("List Tickets:")
    print_response(response)

    # Get a ticket
    if response.status_code == 200:
        tickets = response.json().get("results", [])
        if tickets:
            ticket_id = tickets[0]["id"]
            detail_url = f"{API_URL}/tickets/{ticket_id}/"
            response = requests.get(detail_url, headers=headers_with_token(token))
            print(f"Get Ticket Details ({ticket_id}):")
            print_response(response)

            # Mark ticket as used
            mark_used_url = f"{API_URL}/tickets/{ticket_id}/mark_as_used/"
            response = requests.post(mark_used_url, headers=headers_with_token(token))
            print("Mark Ticket as Used:")
            print_response(response)


def test_booking_cancellation(token, booking_id):
    print("\nTESTING BOOKING CANCELLATION")

    cancel_url = f"{API_URL}/bookings/{booking_id}/cancel/"
    response = requests.post(cancel_url, headers=headers_with_token(token))
    print("Cancel Booking:")
    print_response(response)


if __name__ == "__main__":
    # Login as admin
    admin_token = login(username="admin1@gmail.com", password="admin1")
    if admin_token:
        # Create test data and run tests
        try:
            show_id = create_test_show(admin_token)
            booking_id = test_bookings(admin_token, show_id)
            if booking_id:
                test_tickets(admin_token, booking_id)
                test_booking_cancellation(admin_token, booking_id)
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Failed to login as admin, cannot run tests.")
