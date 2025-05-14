from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from users.views import LoginView

User = get_user_model()


class Command(BaseCommand):
    help = "Test sending 2FA verification email"

    def add_arguments(self, parser):
        parser.add_argument(
            "email", type=str, help="Email of the user to send the test 2FA code to"
        )

    def handle(self, *args, **options):
        email = options["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"User with email {email} does not exist")
            )
            return

        # Create a login view instance
        login_view = LoginView()

        # Generate a code and send email
        code = login_view._generate_2fa_code()
        login_view._send_2fa_email(user, code)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully sent 2FA test email to {email} with code {code}"
            )
        )
