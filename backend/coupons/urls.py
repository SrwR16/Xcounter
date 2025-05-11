from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CouponUsageViewSet, CouponViewSet

router = DefaultRouter()
router.register(r"coupons", CouponViewSet, basename="coupon")
router.register(r"coupon-usages", CouponUsageViewSet, basename="coupon-usage")

urlpatterns = [
    path("", include(router.urls)),
]
