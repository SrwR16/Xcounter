from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"bookings", views.BookingViewSet, basename="booking")
router.register(r"tickets", views.TicketViewSet, basename="ticket")

app_name = "bookings"

urlpatterns = [
    # Explicit URL pattern for seats endpoint first, without 'bookings/' prefix
    path(
        "seats/",
        views.BookingViewSet.as_view({"get": "seats"}),
        name="booking-seats",
    ),
    path("", include(router.urls)),
]
