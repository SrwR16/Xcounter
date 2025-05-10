from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssignmentViewSet,
    DepartmentViewSet,
    EmployeeProfileViewSet,
    EmployeeStatsViewSet,
    LeaveViewSet,
    PerformanceReviewViewSet,
    PositionViewSet,
    SalaryHistoryViewSet,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet)
router.register(r"positions", PositionViewSet)
router.register(r"profiles", EmployeeProfileViewSet)
router.register(r"salary-history", SalaryHistoryViewSet)
router.register(r"performance-reviews", PerformanceReviewViewSet)
router.register(r"assignments", AssignmentViewSet)
router.register(r"leaves", LeaveViewSet)
router.register(r"stats", EmployeeStatsViewSet, basename="employee-stats")

urlpatterns = [
    path("", include(router.urls)),
]
