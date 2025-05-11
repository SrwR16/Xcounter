from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CustomerProfileViewSet, PointsTransactionViewSet, TierBenefitViewSet

router = DefaultRouter()
router.register(r"tier-benefits", TierBenefitViewSet, basename="tier-benefit")
router.register(
    r"customer-profiles", CustomerProfileViewSet, basename="customer-profile"
)
router.register(
    r"points-transactions", PointsTransactionViewSet, basename="points-transaction"
)

urlpatterns = [
    path("", include(router.urls)),
]
