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
    path("", include(router.urls)),
    path("", include(messages_router.urls)),
    path(
        "preferences/",
        views.UserNotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    path("test/", views.TestNotificationView.as_view(), name="test-notification"),
]
