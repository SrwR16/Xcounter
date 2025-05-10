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


def test_coupons(admin_token):
    """Test coupon creation and validation"""
    print("\n=== TESTING COUPONS ===")

    # Create a new coupon
    tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime(
        "%Y-%m-%dT%H:%M:%S"
    )
    next_week = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime(
        "%Y-%m-%dT%H:%M:%S"
    )

    coupon_data = {
        "code": "WELCOME25",
        "description": "25% off your first booking",
        "coupon_type": "PERCENTAGE",
        "discount_value": 25.00,
        "max_discount": 50.00,
        "min_purchase": 20.00,
        "applicability": "ALL",
        "valid_from": tomorrow,
        "valid_to": next_week,
        "max_uses": 100,
        "max_uses_per_user": 1,
    }

    response = requests.post(
        f"{BASE_URL}/coupons/coupons/",
        headers=get_headers(admin_token),
        json=coupon_data,
    )
    print_response(response, "Create Coupon")

    if response.status_code == 201:
        coupon_id = response.json().get("id")

        # List all coupons
        response = requests.get(
            f"{BASE_URL}/coupons/coupons/", headers=get_headers(admin_token)
        )
        print_response(response, "List Coupons")

        # Get specific coupon
        response = requests.get(
            f"{BASE_URL}/coupons/coupons/{coupon_id}/", headers=get_headers(admin_token)
        )
        print_response(response, "Get Coupon")


def test_loyalty_tiers(admin_token, user_token):
    """Test loyalty tier benefits and customer profiles"""
    print("\n=== TESTING LOYALTY SYSTEM ===")

    # List tier benefits
    response = requests.get(
        f"{BASE_URL}/promotions/tier-benefits/", headers=get_headers(user_token)
    )
    print_response(response, "List Tier Benefits")

    # Get user's loyalty profile
    response = requests.get(
        f"{BASE_URL}/promotions/customer-profiles/me/", headers=get_headers(user_token)
    )
    print_response(response, "Get My Loyalty Profile")

    # Get user's tier info
    response = requests.get(
        f"{BASE_URL}/promotions/customer-profiles/my_tier_info/",
        headers=get_headers(user_token),
    )
    print_response(response, "Get My Tier Info")

    # Admin: List all customer profiles
    response = requests.get(
        f"{BASE_URL}/promotions/customer-profiles/", headers=get_headers(admin_token)
    )
    print_response(response, "List All Customer Profiles (Admin)")

    # Admin: Adjust customer points
    customer_id = None
    try:
        for profile in response.json().get("results", []):
            if profile["user_email"] == USER_EMAIL:
                customer_id = profile["id"]
                break
    except:
        pass

    if customer_id:
        # Add points to customer
        response = requests.post(
            f"{BASE_URL}/promotions/customer-profiles/{customer_id}/adjust_points/",
            headers=get_headers(admin_token),
            json={"points": 500, "reason": "Welcome bonus"},
        )
        print_response(response, "Admin: Add Points to Customer")

        # Check updated profile
        response = requests.get(
            f"{BASE_URL}/promotions/customer-profiles/me/",
            headers=get_headers(user_token),
        )
        print_response(response, "Updated Loyalty Profile")

        # Customer: Redeem points
        response = requests.post(
            f"{BASE_URL}/promotions/customer-profiles/adjust_my_points/",
            headers=get_headers(user_token),
            json={"points": -100, "reason": "Free popcorn"},
        )
        print_response(response, "Customer: Redeem Points")

        # Check points history
        response = requests.get(
            f"{BASE_URL}/promotions/customer-profiles/my_points_history/",
            headers=get_headers(user_token),
        )
        print_response(response, "Points Transaction History")


def main():
    """Main test function"""
    # Login as admin
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        print("Admin login failed. Exiting.")
        return

    # Login as user
    user_token = login(USER_EMAIL, USER_PASSWORD)
    if not user_token:
        print("User login failed. Exiting.")
        return

    # Test coupons
    test_coupons(admin_token)

    # Test loyalty system
    test_loyalty_tiers(admin_token, user_token)


if __name__ == "__main__":
    main()
