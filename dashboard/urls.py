from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .charts import chart_views
from .views import (
    AdminDashboardView,
    DashboardLayoutViewSet,
    DashboardMetricsView,
    EmployeeReportView,
    GeneratedReportViewSet,
    GenerateReportView,
    MetricValueViewSet,
    MetricViewSet,
    ModeratorDashboardView,
    MovieReportView,
    ReportListView,
    ReportTemplateViewSet,
    RoleBasedDashboardView,
    SalesReportView,
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

chart_urlpatterns = [
    path(
        "charts/movie-ratings/",
        chart_views.MovieRatingsChartView.as_view(),
        name="movie-ratings-chart",
    ),
    path(
        "charts/bookings-over-time/",
        chart_views.BookingsOverTimeChartView.as_view(),
        name="bookings-over-time-chart",
    ),
    path(
        "charts/genre-distribution/",
        chart_views.GenreDistributionChartView.as_view(),
        name="genre-distribution-chart",
    ),
    path(
        "charts/ticket-types/",
        chart_views.TicketTypesChartView.as_view(),
        name="ticket-types-chart",
    ),
    path(
        "charts/monthly-revenue/",
        chart_views.MonthlyRevenueChartView.as_view(),
        name="monthly-revenue-chart",
    ),
]

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    # Custom API endpoints
    path(
        "dashboard-metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"
    ),
    path("role-dashboard/", RoleBasedDashboardView.as_view(), name="role-dashboard"),
    path("generate-report/", GenerateReportView.as_view(), name="generate-report"),
    path(
        "admin-dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),
    path(
        "moderator-dashboard/",
        ModeratorDashboardView.as_view(),
        name="moderator-dashboard",
    ),
    path("reports/", ReportListView.as_view(), name="report-list"),
    path(
        "reports/movies/",
        MovieReportView.as_view(),
        name="movie-report",
    ),
    path(
        "reports/sales/",
        SalesReportView.as_view(),
        name="sales-report",
    ),
    path(
        "reports/employees/",
        EmployeeReportView.as_view(),
        name="employee-report",
    ),
] + chart_urlpatterns
