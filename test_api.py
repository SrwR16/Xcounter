import json
import random

import requests

BASE_URL = "http://localhost:8000/api/auth"


def test_registration():
    url = f"{BASE_URL}/register/"
    # Use a random email to avoid conflicts
    random_number = random.randint(1000, 9999)
    email = f"customer{random_number}@example.com"

    data = {
        "email": email,
        "password": "Password123!",
        "password_confirm": "Password123!",
        "role": "CUSTOMER",
    }

    # Profile data
    profile_data = {
        "profile.full_name": "Test Customer",
        "profile.phone_number": "1234567890",
        "profile.address": "123 Test Street",
    }

    # Merge the dictionaries
    data.update(profile_data)

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    response = requests.post(url, data=data, headers=headers)
    print(f"Registration Status Code: {response.status_code}")

    try:
        response_json = response.json()
        print(f"Registration Response: {json.dumps(response_json, indent=2)}")
        return response_json, email
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response text: {response.text}")
        return None, email


def test_login(email, password):
    url = f"{BASE_URL}/login/"
    data = {"email": email, "password": password}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    response = requests.post(url, data=data, headers=headers)
    print(f"Login Status Code: {response.status_code}")

    try:
        response_json = response.json()
        print(f"Login Response: {json.dumps(response_json, indent=2)}")
        return response_json.get("token")
    except Exception as e:
        print(f"Login Error: {e}")
        print(f"Response text: {response.text}")
        return None


def test_get_current_user(token):
    url = f"{BASE_URL}/users/me/"
    headers = {"Authorization": f"Token {token}"}

    response = requests.get(url, headers=headers)
    print(f"Get Current User Status Code: {response.status_code}")

    try:
        response_json = response.json()
        print(f"Current User: {json.dumps(response_json, indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
        print(f"Response text: {response.text}")


if __name__ == "__main__":
    # Test registration
    registration_data, email = test_registration()

    # Test login
    if registration_data:
        token = test_login(email, "Password123!")

        # Test get current user
        if token:
            test_get_current_user(token)
