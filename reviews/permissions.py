from rest_framework import permissions

from bookings.models import Booking


class HasBookedMovie(permissions.BasePermission):
    """
    Custom permission to only allow users who have booked a movie to review it.
    """

    def has_permission(self, request, view):
        # Allow all safe methods (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # For POST method, check movie_id in data
        movie_id = request.data.get("movie")
        if not movie_id:
            return False

        # Check if user has a confirmed booking for this movie
        return Booking.objects.filter(
            user=request.user, show__movie_id=movie_id, status="CONFIRMED"
        ).exists()

    def has_object_permission(self, request, view, obj):
        # Allow all safe methods
        if request.method in permissions.SAFE_METHODS:
            return True

        # Update or delete allowed only if user is the author
        if request.method in ["PUT", "PATCH", "DELETE"]:
            return obj.user == request.user

        return False


class IsStaffOrOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners or staff to edit.
    """

    def has_permission(self, request, view):
        # Allow all users to view
        if request.method in permissions.SAFE_METHODS:
            return True

        # Authenticated users can create
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow all users to view
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow staff and moderators
        if request.user.is_staff or request.user.is_moderator:
            return True

        # Allow owner of the review for replies
        if hasattr(obj, "review"):
            return obj.review.user == request.user

        # Allow owner of the review
        return obj.user == request.user
