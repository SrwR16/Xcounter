from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    # Authentication endpoints
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    # Email verification
    path(
        "verify-email/<str:uidb64>/<str:token>/",
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
        "password-reset-confirm/<str:uidb64>/<str:token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "password-change/", views.ChangePasswordView.as_view(), name="password_change"
    ),
    # User management
    path("users/", views.UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path("users/me/", views.CurrentUserView.as_view(), name="current_user"),
    path(
        "users/<int:pk>/profile/",
        views.UserProfileDetailView.as_view(),
        name="user_profile",
    ),
]
