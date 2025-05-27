"""
URL configuration for xcounter project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


def home_view(request):
    return JsonResponse(
        {
            "message": "XCounter Movie Booking API",
            "endpoints": {
                "users": "api/users/",
                "movies": "api/movies/",
                "bookings": "api/bookings/",
                "coupons": "api/coupons/",
                "promotions": "api/promotions/",
                "employees": "api/employees/",
                "dashboard": "api/dashboard/",
                "notifications": {
                    "list": "api/notifications/notifications/",
                    "preferences": "api/notifications/preferences/",
                    "mark_as_read": "api/notifications/notifications/{id}/mark_as_read/",
                    "mark_all_as_read": "api/notifications/notifications/mark_all_as_read/",
                    "test": "api/notifications/test/",
                },
                "messaging": {
                    "conversations": "api/messaging/conversations/",
                    "staff_conversations": "api/messaging/staff/conversations/",
                    "conversation_detail": "api/messaging/conversations/{id}/",
                    "messages": "api/messaging/conversations/{conversation_id}/messages/",
                    "assign_staff": "api/messaging/conversations/{conversation_id}/assign/",
                    "unread_count": "api/messaging/unread-count/",
                },
                "reviews": {
                    "all_reviews": "api/reviews/reviews/",
                    "my_reviews": "api/reviews/reviews/my_reviews/",
                    "movie_reviews": "api/reviews/movies/{movie_id}/",
                    "add_review": "api/reviews/movies/{movie_id}/add_review/",
                    "review_details": "api/reviews/reviews/{review_id}/",
                    "review_replies": "api/reviews/reviews/{review_id}/replies/",
                },
                "docs": "/swagger/",
            },
        }
    )


class APIRootView(APIView):
    """
    Root view for the API that shows available endpoints
    """

    def get(self, request):
        return Response(
            {
                "message": "XCounter Movie Booking API",
                "endpoints": {
                    "users": "/api/users/",
                    "movies": "/api/movies/",
                    "bookings": "/api/bookings/",
                    "coupons": "/api/coupons/",
                    "promotions": "/api/promotions/",
                    "employees": "/api/employees/",
                    "dashboard": "/api/dashboard/",
                    "notifications": "/api/notifications/",
                    "reviews": "/api/reviews/",
                    "messaging": "/api/messaging/",
                    "docs": "/swagger/",
                },
            },
            status=status.HTTP_200_OK,
        )


urlpatterns = [
    path("", home_view, name="home"),
    path("admin/", admin.site.urls),
    path("api/", APIRootView.as_view(), name="api_root"),
    path("api/users/", include("users.urls")),
    path("api/movies/", include("movies.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/coupons/", include("coupons.urls")),
    path("api/promotions/", include("promotions.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/messaging/", include("messaging.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
