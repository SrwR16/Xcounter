#!/usr/bin/env python
import json
from datetime import datetime, timedelta

import requests

# Configuration
BASE_URL = "http://localhost:8000/api"


# Helper functions
def print_response(response):
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Response text: {response.text}")
    print("-" * 50)


def login(email, password):
    url = f"{BASE_URL}/auth/login/"
    data = {"email": email, "password": password}
    response = requests.post(url, data=data)
    if response.status_code == 200:
        token = response.json().get("token")
        return token
    else:
        print(f"Login failed: {response.text}")
        return None


def headers_with_token(token):
    return {"Authorization": f"Token {token}", "Content-Type": "application/json"}


# Test functions
def test_genres(token):
    print("\nTESTING GENRE APIs")

    # Create a genre (admin only)
    create_url = f"{BASE_URL}/movies/genres/"
    genre_data = {
        "name": f"Action-{datetime.now().timestamp()}",  # Add timestamp to make unique
        "description": "Action movies with high-octane sequences",
    }
    response = requests.post(
        create_url, json=genre_data, headers=headers_with_token(token)
    )
    print("Create Genre:")
    print_response(response)

    if response.status_code == 201:
        genre_id = response.json().get("id")
    else:
        # If creation failed, just get an existing genre
        list_url = f"{BASE_URL}/movies/genres/"
        response = requests.get(list_url)
        genres = response.json().get("results", [])
        genre_id = genres[0]["id"] if genres else None

    # List genres (available to anyone)
    list_url = f"{BASE_URL}/movies/genres/"
    response = requests.get(list_url)
    print("List Genres:")
    print_response(response)

    # Retrieve a specific genre
    if genre_id:
        retrieve_url = f"{BASE_URL}/movies/genres/{genre_id}/"
        response = requests.get(retrieve_url)
        print(f"Retrieve Genre {genre_id}:")
        print_response(response)

    return genre_id


def test_movies(token, genre_id):
    print("\nTESTING MOVIE APIs")

    # Create a movie (admin only)
    create_url = f"{BASE_URL}/movies/movies/"
    release_date = datetime.now().strftime("%Y-%m-%d")
    movie_data = {
        "title": f"Amazing Movie {datetime.now().timestamp()}",  # Add timestamp to make unique
        "description": "An incredible story of adventure and excitement.",
        "release_date": release_date,
        "duration_minutes": 120,
        "genre_ids": [genre_id],
        "director": "Jane Director",
        "cast": "John Actor, Mary Actress",
        "rating": 8.5,
    }
    response = requests.post(
        create_url, json=movie_data, headers=headers_with_token(token)
    )
    print("Create Movie:")
    print_response(response)

    if response.status_code == 201:
        movie_id = response.json().get("id")
    else:
        # If creation failed, just get an existing movie
        list_url = f"{BASE_URL}/movies/movies/"
        response = requests.get(list_url)
        movies = response.json().get("results", [])
        movie_id = movies[0]["id"] if movies else None

    # List movies (available to anyone)
    list_url = f"{BASE_URL}/movies/movies/"
    response = requests.get(list_url)
    print("List Movies:")
    print_response(response)

    # Retrieve a specific movie
    if movie_id:
        retrieve_url = f"{BASE_URL}/movies/movies/{movie_id}/"
        response = requests.get(retrieve_url)
        print(f"Retrieve Movie {movie_id}:")
        print_response(response)

    return movie_id


def test_theaters(token):
    print("\nTESTING THEATER APIs")

    # Create a theater (admin only)
    create_url = f"{BASE_URL}/movies/theaters/"
    theater_data = {
        "name": f"Grand Cinema {datetime.now().timestamp()}",  # Add timestamp to make unique
        "location": "123 Main Street",
        "capacity": 150,
        "description": "A luxurious movie theater with comfortable seating.",
    }
    response = requests.post(
        create_url, json=theater_data, headers=headers_with_token(token)
    )
    print("Create Theater:")
    print_response(response)

    if response.status_code == 201:
        theater_id = response.json().get("id")
    else:
        # If creation failed, just get an existing theater
        list_url = f"{BASE_URL}/movies/theaters/"
        response = requests.get(list_url)
        theaters = response.json().get("results", [])
        theater_id = theaters[0]["id"] if theaters else None

    # List theaters (available to anyone)
    list_url = f"{BASE_URL}/movies/theaters/"
    response = requests.get(list_url)
    print("List Theaters:")
    print_response(response)

    return theater_id


def test_shows(token, movie_id, theater_id):
    print("\nTESTING SHOW APIs")

    # Create a show (admin/moderator only)
    create_url = f"{BASE_URL}/movies/shows/"
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
        create_url, json=show_data, headers=headers_with_token(token)
    )
    print("Create Show:")
    print_response(response)

    if response.status_code == 201:
        show_id = response.json().get("id")
    else:
        # If creation failed, just get an existing show
        list_url = f"{BASE_URL}/movies/shows/"
        response = requests.get(list_url)
        shows = response.json().get("results", [])
        show_id = shows[0]["id"] if shows else None

    # List shows (available to anyone)
    list_url = f"{BASE_URL}/movies/shows/"
    response = requests.get(list_url)
    print("List Shows:")
    print_response(response)

    # Get upcoming shows
    upcoming_url = f"{BASE_URL}/movies/shows/upcoming/"
    response = requests.get(upcoming_url)
    print("Upcoming Shows:")
    print_response(response)

    return show_id


if __name__ == "__main__":
    # Login as admin
    admin_token = login("admin@gmail.com", "admin")

    if admin_token:
        print(f"Admin token: {admin_token}")

        # Test genre APIs
        genre_id = test_genres(admin_token)

        # Test movie APIs
        movie_id = test_movies(admin_token, genre_id)

        # Test theater APIs
        theater_id = test_theaters(admin_token)

        # Test show APIs
        show_id = test_shows(admin_token, movie_id, theater_id)
    else:
        print(
            "Failed to login. Make sure the server is running and an admin user exists."
        )
