from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssignmentViewSet,
    DepartmentViewSet,
    EmployeeProfileViewSet,
    EmployeeStatsViewSet,
    LeaveViewSet,
    PerformanceMetricViewSet,
    PerformanceReviewViewSet,
    PositionViewSet,
    SalaryHistoryViewSet,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet)
router.register(r"positions", PositionViewSet)
router.register(r"employees", EmployeeProfileViewSet)
router.register(r"leaves", LeaveViewSet)
router.register(r"assignments", AssignmentViewSet)
router.register(r"performance-reviews", PerformanceReviewViewSet)
router.register(r"salary-history", SalaryHistoryViewSet, basename="salary-history")
router.register(r"employee-stats", EmployeeStatsViewSet, basename="employee-stats")
router.register(r"performance-metrics", PerformanceMetricViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
