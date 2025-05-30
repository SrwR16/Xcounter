from django.db.models import Avg, Count, Prefetch, Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from reviews.models import Review, ReviewReply
from users.permissions import IsAdmin, IsAdminOrModerator

from .models import Genre, Movie, Show, Theater
from .serializers import (
    GenreSerializer,
    MovieDetailSerializer,
    MovieListSerializer,
    ShowDetailSerializer,
    ShowListSerializer,
    TheaterSerializer,
)


class GenreViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing movie genres.
    Only admins can create, update, or delete genres.
    """

    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "description"]

    def get_permissions(self):
        """
        Override permissions based on action:
        - Anyone can list and retrieve genres
        - Only admin can create, update or delete genres
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdmin]
        return super().get_permissions()


class MovieViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing movies.
    Admin can create, update, or delete movies.
    Moderator can update movie details.
    Anyone can view active movies.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["genres", "is_active", "release_date"]
    search_fields = ["title", "description", "director", "cast"]
    ordering_fields = ["release_date", "duration_minutes", "rating"]
    ordering = ["-release_date"]

    def get_queryset(self):
        """
        Get movie queryset with optimized DB access.
        """
        queryset = Movie.objects.all()

        # Optimize by prefetching related fields
        if self.action in ["retrieve", "review"]:
            # For detailed views, prefetch reviews and their replies
            reviews_qs = Review.objects.select_related("user").filter(is_approved=True)
            queryset = queryset.prefetch_related(
                Prefetch("reviews", queryset=reviews_qs),
                Prefetch(
                    "reviews__replies",
                    queryset=ReviewReply.objects.select_related("user"),
                ),
            )
        elif self.action == "list":
            # For list views, annotate with count and ratings
            queryset = queryset.annotate(
                review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
                avg_rating=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
            )

        # Filter for active movies unless explicitly requested otherwise
        if self.action == "list" and not self.request.query_params.get(
            "include_inactive"
        ):
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == "list":
            return MovieListSerializer
        return MovieDetailSerializer

    def get_permissions(self):
        """
        Override permissions based on action:
        - Anyone can list and retrieve active movies
        - Admin can create, update, or delete movies
        - Moderator can update movies
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [AllowAny]
        elif self.action in ["create", "destroy"]:
            self.permission_classes = [IsAdmin]
        else:  # update, partial_update
            self.permission_classes = [IsAdminOrModerator]
        return super().get_permissions()

    @method_decorator(cache_page(60 * 30))  # Cache for 30 minutes
    @action(detail=False, methods=["get"], url_path="featured")
    def featured_movies(self, request):
        """API endpoint to get featured movies (those with highest ratings)"""
        # Use annotate to calculate average rating directly in the database
        movies = (
            Movie.objects.filter(is_active=True)
            .annotate(
                avg_rating=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
                review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            )
            .filter(review_count__gt=0)
            .order_by("-avg_rating")[:5]
        )

        serializer = MovieListSerializer(
            movies, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    @action(detail=False, methods=["get"], url_path="popular")
    def popular_movies(self, request):
        """API endpoint to get popular movies (those with most bookings)"""
        # Use annotate to calculate booking count directly in the database
        movies = (
            Movie.objects.filter(is_active=True)
            .annotate(booking_count=Count("shows__booking", distinct=True))
            .order_by("-booking_count")[:5]
        )

        serializer = MovieListSerializer(
            movies, many=True, context={"request": request}
        )
        return Response(serializer.data)


class TheaterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing theaters.
    Admin can create, update, or delete theaters.
    Moderator can update theater details.
    Anyone can view active theaters.
    """

    queryset = Theater.objects.all()
    serializer_class = TheaterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "location", "description"]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        """Filter theaters based on user role"""
        if self.request.user.is_authenticated and (
            self.request.user.is_admin or self.request.user.is_moderator
        ):
            # Admin and Moderator can see all theaters including inactive ones
            return Theater.objects.all()
        else:
            # Other users can only see active theaters
            return Theater.objects.filter(is_active=True)

    def get_permissions(self):
        """
        Override permissions based on action:
        - Anyone can list and retrieve active theaters
        - Admin can create, update, or delete theaters
        - Moderator can update theaters
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [AllowAny]
        elif self.action in ["create", "destroy"]:
            self.permission_classes = [IsAdmin]
        else:  # update, partial_update
            self.permission_classes = [IsAdminOrModerator]
        return super().get_permissions()


class ShowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing shows.
    Admin can create, update, or delete shows.
    Moderator can create or update shows.
    Anyone can view active shows.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [
        filters.SearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    filterset_fields = ["movie", "theater", "show_type", "start_time", "is_active"]
    ordering_fields = ["start_time", "price"]
    ordering = ["start_time"]

    def get_queryset(self):
        """Filter shows based on user role and query parameters"""
        if self.request.user.is_authenticated and (
            self.request.user.is_admin or self.request.user.is_moderator
        ):
            # Admin and Moderator can see all shows including inactive ones
            queryset = Show.objects.all()
        else:
            # Other users can only see active shows for active movies in active theaters
            queryset = Show.objects.filter(
                is_active=True, movie__is_active=True, theater__is_active=True
            )

        # Additional filters from query parameters
        movie_id = self.request.query_params.get("movie_id")
        theater_id = self.request.query_params.get("theater_id")
        date = self.request.query_params.get("date")

        if movie_id:
            queryset = queryset.filter(movie_id=movie_id)
        if theater_id:
            queryset = queryset.filter(theater_id=theater_id)
        if date:
            queryset = queryset.filter(start_time__date=date)

        return queryset

    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == "list":
            return ShowListSerializer
        return ShowDetailSerializer

    def get_permissions(self):
        """
        Override permissions based on action:
        - Anyone can list, retrieve, and view upcoming shows
        - Admin can create, update, or delete shows
        - Moderator can create or update shows
        """
        if self.action in ["list", "retrieve", "upcoming_shows"]:
            return [AllowAny()]
        elif self.action == "destroy":
            return [IsAdmin()]
        else:  # create, update, partial_update
            return [IsAdminOrModerator()]

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming_shows(self, request):
        """API endpoint to get upcoming shows"""
        from django.utils import timezone

        shows = Show.objects.filter(
            is_active=True,
            movie__is_active=True,
            theater__is_active=True,
            start_time__gt=timezone.now(),
        ).order_by("start_time")[:10]

        serializer = ShowListSerializer(shows, many=True, context={"request": request})
        return Response(serializer.data)
