from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser, UserProfile
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


class LoginView(generics.GenericAPIView):
    """
    View for user login
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
