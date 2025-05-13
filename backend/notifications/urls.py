from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter

from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r"notifications", views.NotificationViewSet, basename="notification")
router.register(r"conversations", views.ConversationViewSet, basename="conversation")

# Nested router for messages within conversations
messages_router = NestedSimpleRouter(router, r"conversations", lookup="conversation")
messages_router.register(
    r"messages", views.MessageViewSet, basename="conversation-messages"
)

app_name = "notifications"

urlpatterns = [
    # Explicit notification action URLs first, without 'notifications/' prefix
    path(
        "mark_all_as_read/",
        views.NotificationViewSet.as_view({"post": "mark_all_as_read"}),
        name="notification-mark-all-as-read",
    ),
    path(
        "<int:pk>/mark_as_read/",
        views.NotificationViewSet.as_view({"post": "mark_as_read"}),
        name="notification-mark-as-read",
    ),
    path(
        "preferences/",
        views.UserNotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    path("test/", views.TestNotificationView.as_view(), name="test-notification"),
    path("", include(router.urls)),
    path("", include(messages_router.urls)),
]
