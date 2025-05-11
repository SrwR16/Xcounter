import json

import requests

# Base URL
BASE_URL = "http://localhost:8000/api"


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


def test_login(email, password):
    """Test login with given credentials"""
    print(f"\nTesting login for: {email}")
    login_url = f"{BASE_URL}/users/login/"
    login_data = {"email": email, "password": password}
    response = requests.post(login_url, json=login_data)
    print_response(response)
    return response.status_code == 200, response.json().get(
        "token"
    ) if response.status_code == 200 else None


if __name__ == "__main__":
    # Test login with different credentials
    test_login("admin1@gmail.com", "admin1")
    test_login("admin@gmail.com", "adminpassword")
