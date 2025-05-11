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
                    "conversations": "api/notifications/conversations/",
                    "messages": "api/notifications/conversations/{conversation_id}/messages/",
                    "close_conversation": "api/notifications/conversations/{id}/close/",
                    "reopen_conversation": "api/notifications/conversations/{id}/reopen/",
                    "mark_message_read": "api/notifications/conversations/{conversation_id}/messages/{id}/mark_read/",
                    "mark_all_messages_read": "api/notifications/conversations/{conversation_id}/messages/mark_all_read/",
                },
                "docs": "/swagger/",
            },
        }
    )


urlpatterns = [
    path("", home_view, name="home"),
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/movies/", include("movies.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/coupons/", include("coupons.urls")),
    path("api/promotions/", include("promotions.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/notifications/", include("notifications.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
