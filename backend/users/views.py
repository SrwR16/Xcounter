from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.csrf import csrf_protect
from django.views.generic import FormView, View
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import CustomUserCreationForm, TwoFactorVerificationForm
from .models import CustomUser, TwoFactorCode, UserProfile
from .permissions import IsAdmin, IsOwnerOrAdminOrModerator
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from .tokens import email_verification_token
from .utils import (
    send_password_reset_email,
    send_verification_email,
    send_welcome_email,
)


class RegisterView(generics.CreateAPIView):
    """
    View for user registration
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send email verification
        send_verification_email(request, user)

        return Response(
            {
                "user": UserSerializer(
                    user, context=self.get_serializer_context()
                ).data,
                "message": "User registered successfully. Please check your email to verify your account.",
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_protect, name="dispatch")
class LoginView(FormView):
    template_name = "users/login.html"
    form_class = CustomUserCreationForm
    success_url = reverse_lazy("dashboard:home")

    def form_valid(self, form):
        email = form.cleaned_data.get("email")
        password = form.cleaned_data.get("password")
        user = authenticate(username=email, password=password)

        if user is not None:
            # Check if user is admin or moderator
            if user.is_staff or user.is_moderator:
                # Generate 2FA code and send email
                code_obj = TwoFactorCode.generate_code(user)
                self._send_2fa_email(user, code_obj.code)

                # Store user_id in session for 2FA verification
                self.request.session["user_id_2fa"] = user.id
                return HttpResponseRedirect(reverse("users:verify_2fa"))
            else:
                # Regular user, log them in directly
                login(self.request, user)
                return super().form_valid(form)
        else:
            form.add_error(None, "Invalid email or password.")
            return self.form_invalid(form)

    def _send_2fa_email(self, user, code):
        """Send 2FA code to user's email."""
        from django.conf import settings
        from django.core.mail import send_mail

        subject = "Your XCounter Two-Factor Authentication Code"
        message = f"""
        Hello {user.email},

        Your two-factor authentication code is: {code}

        This code will expire in 10 minutes.

        If you did not request this code, please ignore this email.

        Regards,
        The XCounter Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


class LogoutView(APIView):
    """
    View for user logout
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Delete token for user
            token = Token.objects.get(user=request.user)
            token.delete()

            # Logout user
            logout(request)

            return Response(
                {"message": "Successfully logged out."}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyEmailView(APIView):
    """
    View for email verification
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and email_verification_token.check_token(user, token):
            user.is_email_verified = True
            user.save()

            # Send welcome email
            send_welcome_email(user)

            return Response(
                {
                    "message": "Email verified successfully. You can now login to your account."
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "The verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PasswordResetRequestView(generics.GenericAPIView):
    """
    View for password reset request
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
            send_password_reset_email(request, user)

            return Response(
                {"message": "Password reset link has been sent to your email."},
                status=status.HTTP_200_OK,
            )
        except CustomUser.DoesNotExist:
            # We still return a positive response for security reasons
            return Response(
                {
                    "message": "If the email is associated with an account, a password reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )


class PasswordResetConfirmView(APIView):
    """
    View for password reset confirmation
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and email_verification_token.check_token(user, token):
            password = request.data.get("password")
            password_confirm = request.data.get("password_confirm")

            if not password or not password_confirm:
                return Response(
                    {"error": "Both password and password confirmation are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if password != password_confirm:
                return Response(
                    {"error": "Passwords don't match."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(password)
            user.save()

            return Response(
                {
                    "message": "Password reset successful. You can now login with your new password."
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "The password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChangePasswordView(generics.UpdateAPIView):
    """
    View for changing password
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save()

        # Update token
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        return Response(
            {"message": "Password changed successfully.", "token": token.key},
            status=status.HTTP_200_OK,
        )


class UserListView(generics.ListAPIView):
    """
    View for listing users (admin only)
    """

    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = CustomUser.objects.all()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating or deleting a user
    """

    permission_classes = [IsOwnerOrAdminOrModerator]
    serializer_class = UserSerializer
    queryset = CustomUser.objects.all()


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    View for retrieving or updating user profile
    """

    permission_classes = [IsOwnerOrAdminOrModerator]
    serializer_class = UserProfileSerializer
    queryset = UserProfile.objects.all()


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    View for retrieving or updating current user
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


@method_decorator(csrf_protect, name="dispatch")
class TwoFactorVerificationView(FormView):
    template_name = "users/verify_2fa.html"
    form_class = TwoFactorVerificationForm
    success_url = reverse_lazy("dashboard:home")

    def dispatch(self, request, *args, **kwargs):
        # Check if user_id_2fa is in session
        if "user_id_2fa" not in request.session:
            messages.error(request, "2FA session expired. Please log in again.")
            return redirect("users:login")
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        user_id = self.request.session.get("user_id_2fa")
        code = form.cleaned_data.get("code")

        try:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            user = User.objects.get(id=user_id)

            # Get latest code for user
            code_obj = (
                TwoFactorCode.objects.filter(user=user, is_used=False, code=code)
                .order_by("-created_at")
                .first()
            )

            if code_obj and code_obj.is_valid():
                # Mark code as used
                code_obj.is_used = True
                code_obj.save()

                # Login user
                login(self.request, user)

                # Clear session
                if "user_id_2fa" in self.request.session:
                    del self.request.session["user_id_2fa"]

                messages.success(self.request, "Two-factor authentication successful.")
                return super().form_valid(form)
            else:
                form.add_error("code", "Invalid or expired code.")
                return self.form_invalid(form)

        except User.DoesNotExist:
            form.add_error(None, "Authentication failed. Please try again.")
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user_id = self.request.session.get("user_id_2fa")

        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            context["email"] = user.email
        except User.DoesNotExist:
            pass

        return context


class ResendTwoFactorCodeView(View):
    """View to resend 2FA code."""

    def get(self, request, *args, **kwargs):
        user_id = request.session.get("user_id_2fa")

        if not user_id:
            messages.error(request, "Session expired. Please log in again.")
            return redirect("users:login")

        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            code_obj = TwoFactorCode.generate_code(user)

            # Send email with code
            from django.conf import settings
            from django.core.mail import send_mail

            subject = "Your XCounter Two-Factor Authentication Code"
            message = f"""
            Hello {user.email},

            Your new two-factor authentication code is: {code_obj.code}

            This code will expire in 10 minutes.

            If you did not request this code, please ignore this email.

            Regards,
            The XCounter Team
            """

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            messages.success(
                request, "A new verification code has been sent to your email."
            )
        except User.DoesNotExist:
            messages.error(request, "User not found. Please log in again.")

        return redirect("users:verify_2fa")


class LoginAPIView(generics.GenericAPIView):
    """
    View for user login via API
    """

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        token = serializer.validated_data["token"]

        user = get_object_or_404(CustomUser, email=email)
        login(request, user)

        return Response(
            {
                "user": UserSerializer(
                    user, context=self.get_serializer_context()
                ).data,
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class UsersAPIView(APIView):
    """
    Root view for the users API that shows available endpoints
    """

    def get(self, request):
        return Response(
            {
                "message": "Users API",
                "endpoints": {
                    "register": "/api/users/register/",
                    "login": "/api/users/login/",
                    "logout": "/api/users/logout/",
                    "verify_2fa": "/api/users/verify-2fa/",
                    "resend_2fa_code": "/api/users/resend-2fa-code/",
                    "verify_email": "/api/users/verify-email/<uidb64>/<token>/",
                    "password_reset": "/api/users/password-reset/",
                    "password_reset_confirm": "/api/users/password-reset/<uidb64>/<token>/",
                    "user_list": "/api/users/users/",
                    "user_detail": "/api/users/users/<int:pk>/",
                    "profile_detail": "/api/users/profile/<int:pk>/",
                    "current_user": "/api/users/me/",
                    "change_password": "/api/users/change-password/",
                },
            },
            status=status.HTTP_200_OK,
        )
