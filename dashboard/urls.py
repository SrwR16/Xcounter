from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardLayoutViewSet,
    DashboardMetricsView,
    GeneratedReportViewSet,
    GenerateReportView,
    MetricValueViewSet,
    MetricViewSet,
    ReportTemplateViewSet,
    RoleBasedDashboardView,
)

# Create a router for ViewSets
router = DefaultRouter()
router.register(r"metrics", MetricViewSet, basename="metric")
router.register(r"metric-values", MetricValueViewSet, basename="metric-value")
router.register(
    r"dashboard-layouts", DashboardLayoutViewSet, basename="dashboard-layout"
)
router.register(r"report-templates", ReportTemplateViewSet, basename="report-template")
router.register(
    r"generated-reports", GeneratedReportViewSet, basename="generated-report"
)

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    # Custom API endpoints
    path(
        "dashboard-metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"
    ),
    path("role-dashboard/", RoleBasedDashboardView.as_view(), name="role-dashboard"),
    path("generate-report/", GenerateReportView.as_view(), name="generate-report"),
]
