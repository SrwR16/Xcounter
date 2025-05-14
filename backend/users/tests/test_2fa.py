from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class TwoFactorAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
            is_active=True,
        )
        self.login_url = reverse("login")
        self.verify_2fa_url = reverse("verify_2fa")

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        DEFAULT_FROM_EMAIL="test@xcounter.com",
    )
    @patch("users.views.LoginView._generate_2fa_code", return_value="123456")
    def test_2fa_email_html_content(self, mock_generate_code):
        # Login to trigger 2FA
        response = self.client.post(
            self.login_url, {"email": "test@example.com", "password": "testpassword123"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "2FA code sent to your email")

        # Check if email was sent
        self.assertEqual(len(mail.outbox), 1)

        # Check email contents
        email = mail.outbox[0]
        self.assertEqual(email.subject, "Your XCounter Verification Code")
        self.assertEqual(email.to, ["test@example.com"])

        # Check plain text content
        self.assertIn("Your verification code is: 123456", email.body)

        # Check HTML content
        self.assertIsNotNone(email.alternatives)
        self.assertEqual(len(email.alternatives), 1)
        html_content = email.alternatives[0][0]
        self.assertIn('<div class="verification-code">123456</div>', html_content)
        self.assertIn("Hi Test,", html_content)
        self.assertIn("XCounter", html_content)
