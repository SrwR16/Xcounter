from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission check for admin access.
    """

    message = "Only admin users have access to this resource."

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return request.user.is_admin
        return False


class IsAdminOrModerator(permissions.BasePermission):
    """
    Permission check for admin or moderator access.
    """

    message = "Only admin or moderator users have access to this resource."

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return request.user.is_admin or request.user.is_moderator
        return False


class IsSalesman(permissions.BasePermission):
    """
    Permission check for salesman access.
    """

    message = "Only salesman users have access to this resource."

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return request.user.is_salesman
        return False


class IsOwnerOrAdminOrModerator(permissions.BasePermission):
    """
    Permission check for object ownership or admin/moderator access.
    """

    message = "You must be the owner of this object or an admin/moderator."

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_authenticated:
            if request.user.is_admin or request.user.is_moderator:
                return True

            # Check if the object has a user field directly
            if hasattr(obj, "user"):
                return obj.user == request.user

            # Check if this is a user object itself
            if hasattr(obj, "id") and hasattr(request.user, "id"):
                return obj.id == request.user.id

        return False
