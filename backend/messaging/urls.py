from django.urls import include, path
from rest_framework_nested import routers

from .views import ConversationViewSet, MessageViewSet

router = routers.SimpleRouter()
router.register(r"conversations", ConversationViewSet, basename="conversation")

# Create a nested router for messages within conversations
messages_router = routers.NestedSimpleRouter(
    router, r"conversations", lookup="conversation"
)
messages_router.register(r"messages", MessageViewSet, basename="message")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(messages_router.urls)),
]
