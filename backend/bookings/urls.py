from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, TicketViewSet

router = DefaultRouter()
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"tickets", TicketViewSet, basename="ticket")

urlpatterns = [
    path("", include(router.urls)),
]
