from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r"notifications", views.NotificationViewSet, basename="notification")

app_name = "notifications"

urlpatterns = [
    path("", include(router.urls)),
    path(
        "preferences/",
        views.UserNotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    path("test/", views.TestNotificationView.as_view(), name="test-notification"),
]
