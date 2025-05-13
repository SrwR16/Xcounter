import sys
from datetime import datetime
from urllib.parse import urljoin

import requests


class APITester:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {"success": [], "errors": [], "warnings": []}

    def _make_request(
        self, method, endpoint, data=None, expected_status=200, auth_token=None
    ):
        """Make an HTTP request and return the response"""
        url = urljoin(self.base_url, endpoint)
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if auth_token:
            headers["Authorization"] = f"Token {auth_token}"

        try:
            print(f"\nTesting {method} {url}")
            response = self.session.request(
                method=method, url=url, json=data, headers=headers
            )

            if response.status_code != expected_status:
                error_msg = {
                    "endpoint": endpoint,
                    "method": method,
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "response": response.text,
                }
                print(f"❌ Error: {error_msg}")
                self.results["errors"].append(error_msg)
                return False

            print(f"✅ Success: {method} {url}")
            return response.json()
        except Exception as e:
            error_msg = {"endpoint": endpoint, "method": method, "error": str(e)}
            print(f"❌ Error: {error_msg}")
            self.results["errors"].append(error_msg)
            return False

    def test_auth_endpoints(self):
        """Test authentication related endpoints"""
        print("\n=== Testing Authentication Endpoints ===")

        # Test registration
        register_data = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "Test@123",
            "password_confirm": "Test@123",
            "role": "CUSTOMER",
        }
        response = self._make_request(
            "POST", "/api/users/register/", register_data, 201
        )
        if response:
            self.results["success"].append("User registration successful")

            # Test login
            login_data = {
                "email": register_data["email"],
                "password": register_data["password"],
            }
            response = self._make_request("POST", "/api/users/login/", login_data, 200)
            if response and "token" in response:
                self.results["success"].append("User login successful")
                return response["token"]

        return None

    def test_movie_endpoints(self, auth_token=None):
        """Test movie related endpoints"""
        print("\n=== Testing Movie Endpoints ===")

        # Test movie list
        response = self._make_request(
            "GET", "/api/movies/movies/", auth_token=auth_token
        )
        if response:
            self.results["success"].append("Movie list endpoint working")

            # Test movie filtering
            response = self._make_request(
                "GET",
                "/api/movies/movies/?genres=1&is_active=true",
                auth_token=auth_token,
            )
            if response:
                self.results["success"].append("Movie filtering working")

            # Test featured movies
            response = self._make_request(
                "GET", "/api/movies/movies/featured/", auth_token=auth_token
            )
            if response:
                self.results["success"].append("Featured movies endpoint working")

            # Test popular movies
            response = self._make_request(
                "GET", "/api/movies/movies/popular/", auth_token=auth_token
            )
            if response:
                self.results["success"].append("Popular movies endpoint working")

    def test_booking_endpoints(self, auth_token=None):
        """Test booking related endpoints"""
        print("\n=== Testing Booking Endpoints ===")

        # Test booking list
        response = self._make_request("GET", "/api/bookings/", auth_token=auth_token)
        if response:
            self.results["success"].append("Booking list endpoint working")

            # Test available seats
            response = self._make_request(
                "GET", "/api/bookings/seats/?show_id=1", auth_token=auth_token
            )
            if response:
                self.results["success"].append("Available seats endpoint working")

    def test_notification_endpoints(self, auth_token=None):
        """Test notification related endpoints"""
        print("\n=== Testing Notification Endpoints ===")

        # Test notification list
        response = self._make_request(
            "GET", "/api/notifications/", auth_token=auth_token
        )
        if response:
            self.results["success"].append("Notification list endpoint working")

            # Test mark all as read
            response = self._make_request(
                "POST", "/api/notifications/mark_all_as_read/", auth_token=auth_token
            )
            if response:
                self.results["success"].append(
                    "Mark all notifications as read endpoint working"
                )

            # Test notification preferences
            response = self._make_request(
                "GET", "/api/notifications/preferences/", auth_token=auth_token
            )
            if response:
                self.results["success"].append(
                    "Notification preferences endpoint working"
                )

    def test_review_endpoints(self, auth_token=None):
        """Test review related endpoints"""
        print("\n=== Testing Review Endpoints ===")

        # Test review list
        response = self._make_request("GET", "/api/reviews/", auth_token=auth_token)
        if response:
            self.results["success"].append("Review list endpoint working")

    def run_all_tests(self):
        """Run all API tests"""
        print("\n=== Starting API Tests ===")

        # Test auth endpoints and get token
        auth_token = self.test_auth_endpoints()

        if not auth_token:
            print(
                "\n❌ Authentication failed. Some tests may fail due to missing authentication."
            )

        # Test other endpoints with auth token
        self.test_movie_endpoints(auth_token)
        self.test_booking_endpoints(auth_token)
        self.test_notification_endpoints(auth_token)
        self.test_review_endpoints(auth_token)

        # Print results
        print("\n=== Test Results Summary ===")
        print(f"✅ Successful endpoints: {len(self.results['success'])}")
        print(f"❌ Errors: {len(self.results['errors'])}")
        print(f"⚠️ Warnings: {len(self.results['warnings'])}")

        if self.results["errors"]:
            print("\n=== Detailed Error Report ===")
            for error in self.results["errors"]:
                print(f"\nEndpoint: {error['endpoint']}")
                print(f"Method: {error['method']}")
                if "expected_status" in error:
                    print(f"Expected status: {error['expected_status']}")
                    print(f"Actual status: {error['actual_status']}")
                print(
                    f"Error: {error.get('error', error.get('response', 'Unknown error'))}"
                )

        if self.results["warnings"]:
            print("\n=== Warnings ===")
            for warning in self.results["warnings"]:
                print(f"- {warning}")

        # Return non-zero exit code if there were errors
        return len(self.results["errors"]) > 0


if __name__ == "__main__":
    tester = APITester()
    has_errors = tester.run_all_tests()
    sys.exit(1 if has_errors else 0)
