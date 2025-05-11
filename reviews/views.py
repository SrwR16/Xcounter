from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from movies.models import Movie

from .models import Review, ReviewReply
from .permissions import HasBookedMovie, IsStaffOrOwnerOrReadOnly
from .serializers import (
    MovieReviewsSerializer,
    ReviewDetailSerializer,
    ReviewListSerializer,
    ReviewReplySerializer,
)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing movie reviews.
    """

    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]
    permission_classes = [permissions.IsAuthenticated, HasBookedMovie]

    def get_queryset(self):
        user = self.request.user

        # Staff and moderators can see all reviews, including unapproved ones
        if user.is_staff or user.is_moderator:
            return Review.objects.all()

        # Regular users can see only approved reviews and their own reviews
        return Review.objects.filter(is_approved=True) | Review.objects.filter(
            user=user
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ReviewDetailSerializer
        return ReviewListSerializer

    def perform_create(self, serializer):
        """Set the user to the current user when creating a review."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my_reviews(self, request):
        """Get all reviews by the current user."""
        reviews = Review.objects.filter(user=request.user)
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ReviewListSerializer(reviews, many=True)
        return Response(serializer.data)


class ReviewReplyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing replies to reviews.
    """

    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrOwnerOrReadOnly]

    def get_queryset(self):
        review_id = self.kwargs.get("review_pk")
        if review_id:
            review = get_object_or_404(Review, id=review_id)
            return ReviewReply.objects.filter(review=review)
        return ReviewReply.objects.none()

    def perform_create(self, serializer):
        """Set the user and review when creating a reply."""
        review_id = self.kwargs.get("review_pk")
        review = get_object_or_404(Review, id=review_id)
        serializer.save(user=self.request.user, review=review)


class MovieReviewsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for getting reviews for a specific movie.
    """

    serializer_class = MovieReviewsSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Movie.objects.all()

    @action(detail=True, methods=["post"])
    def add_review(self, request, pk=None):
        """Add a review to a movie."""
        movie = self.get_object()

        # Check if user has already reviewed this movie
        if Review.objects.filter(movie=movie, user=request.user).exists():
            return Response(
                {"error": "You have already reviewed this movie"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user has booked this movie
        from bookings.models import Booking

        if not Booking.objects.filter(
            user=request.user, show__movie=movie, status="CONFIRMED"
        ).exists():
            return Response(
                {"error": "You can only review movies you have booked"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create the review
        serializer = ReviewListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, movie=movie)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def test_create_review(request):
    """Test endpoint to create a review without validations."""
    if not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED
        )

    movie_id = request.data.get("movie")
    if not movie_id:
        return Response(
            {"error": "Movie ID is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    movie = get_object_or_404(Movie, id=movie_id)

    # Create the review directly
    review = Review.objects.create(
        user=request.user,
        movie=movie,
        rating=request.data.get("rating", 5),
        title=request.data.get("title", "Test Review"),
        content=request.data.get("content", "This is a test review."),
        is_approved=True,
    )

    serializer = ReviewDetailSerializer(review)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
