from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .charts.chart_views import (
    AdminDashboardView,
    BookingsOverTimeChartView,
    EmployeeReportView,
    GenreDistributionChartView,
    ModeratorDashboardView,
    MonthlyRevenueChartView,
    MovieRatingsChartView,
    MovieReportView,
    ReportListView,
    SalesReportView,
    TicketTypesChartView,
)
from .views import (
    DashboardLayoutViewSet,
    DashboardMetricsView,
    EmployeePerformanceDashboardView,
    GeneratedReportViewSet,
    GenerateReportView,
    MetricValueViewSet,
    MetricViewSet,
    ReportTemplateViewSet,
    RoleBasedDashboardView,
    download_generated_report,
    generate_report_api,
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
        MovieRatingsChartView.as_view(),
        name="movie-ratings-chart",
    ),
    path(
        "charts/bookings-over-time/",
        BookingsOverTimeChartView.as_view(),
        name="bookings-over-time-chart",
    ),
    path(
        "charts/genre-distribution/",
        GenreDistributionChartView.as_view(),
        name="genre-distribution-chart",
    ),
    path(
        "charts/ticket-types/",
        TicketTypesChartView.as_view(),
        name="ticket-types-chart",
    ),
    path(
        "charts/monthly-revenue/",
        MonthlyRevenueChartView.as_view(),
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
    path(
        "reports/download/<str:filename>/",
        download_generated_report,
        name="download-report",
    ),
    path("reports/generate/", generate_report_api, name="generate-report-api"),
    path(
        "employee-performance/",
        EmployeePerformanceDashboardView.as_view(),
        name="employee-performance-dashboard",
    ),
] + chart_urlpatterns
