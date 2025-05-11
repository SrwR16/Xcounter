from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter

from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r"reviews", views.ReviewViewSet, basename="review")
router.register(r"movies", views.MovieReviewsViewSet, basename="movie-reviews")

# Nested router for review replies
reviews_router = NestedSimpleRouter(router, r"reviews", lookup="review")
reviews_router.register(r"replies", views.ReviewReplyViewSet, basename="review-replies")

app_name = "reviews"

urlpatterns = [
    path("", include(router.urls)),
    path("", include(reviews_router.urls)),
    path("test-create/", views.test_create_review, name="test-create-review"),
]
