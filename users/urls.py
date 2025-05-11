from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    # Authentication endpoints
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("api/auth/login/", views.LoginAPIView.as_view(), name="login-api"),
    # Two-factor authentication URLs
    path("verify-2fa/", views.TwoFactorVerificationView.as_view(), name="verify_2fa"),
    path(
        "resend-2fa-code/",
        views.ResendTwoFactorCodeView.as_view(),
        name="resend_2fa_code",
    ),
    # Email verification
    path(
        "verify-email/<uidb64>/<token>/",
        views.VerifyEmailView.as_view(),
        name="verify_email",
    ),
    # Password reset
    path(
        "password-reset/",
        views.PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "password-reset/<uidb64>/<token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    # User management
    path("users/", views.UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path(
        "profile/<int:pk>/",
        views.UserProfileDetailView.as_view(),
        name="profile_detail",
    ),
    path("me/", views.CurrentUserView.as_view(), name="current_user"),
    path(
        "change-password/",
        views.ChangePasswordView.as_view(),
        name="change_password",
    ),
]
