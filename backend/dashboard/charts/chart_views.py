"""
API views for chart data.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.permissions import IsAdminOrModerator

from ..visualization import (
    get_bookings_over_time_chart_data,
    get_genre_distribution_chart_data,
    get_monthly_revenue_chart_data,
    get_movie_ratings_chart_data,
    get_ticket_types_chart_data,
)


class BaseChartView(APIView):
    """Base class for chart views."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get_chart_data(self, request, **kwargs):
        """Override this method to provide chart data."""
        raise NotImplementedError

    def get(self, request, format=None):
        """Return chart data in the format expected by Chart.js."""
        try:
            chart_data = self.get_chart_data(request)
            return Response(chart_data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(cache_page(60 * 5), name="dispatch")  # Cache for 5 minutes
class MovieRatingsChartView(BaseChartView):
    """API view for movie ratings chart data."""

    def get_chart_data(self, request):
        """Return movie ratings chart data."""
        return get_movie_ratings_chart_data()


@method_decorator(cache_page(60 * 5), name="dispatch")  # Cache for 5 minutes
class BookingsOverTimeChartView(BaseChartView):
    """API view for bookings over time chart data."""

    def get_chart_data(self, request):
        """Return bookings over time chart data."""
        days = request.query_params.get("days", 30)
        try:
            days = int(days)
            if days < 1 or days > 365:
                days = 30
        except (ValueError, TypeError):
            days = 30

        return get_bookings_over_time_chart_data(days=days)


@method_decorator(cache_page(60 * 5), name="dispatch")  # Cache for 5 minutes
class GenreDistributionChartView(BaseChartView):
    """API view for genre distribution chart data."""

    def get_chart_data(self, request):
        """Return genre distribution chart data."""
        return get_genre_distribution_chart_data()


@method_decorator(cache_page(60 * 5), name="dispatch")  # Cache for 5 minutes
class TicketTypesChartView(BaseChartView):
    """API view for ticket types chart data."""

    def get_chart_data(self, request):
        """Return ticket types chart data."""
        return get_ticket_types_chart_data()


@method_decorator(cache_page(60 * 5), name="dispatch")  # Cache for 5 minutes
class MonthlyRevenueChartView(BaseChartView):
    """API view for monthly revenue chart data."""

    def get_chart_data(self, request):
        """Return monthly revenue chart data."""
        months = request.query_params.get("months", 12)
        try:
            months = int(months)
            if months < 1 or months > 60:
                months = 12
        except (ValueError, TypeError):
            months = 12

        return get_monthly_revenue_chart_data(months=months)


class AdminDashboardView(BaseChartView):
    """API view for the admin dashboard."""

    def get_chart_data(self, request):
        """Return admin dashboard data."""
        return {
            "revenue_summary": get_monthly_revenue_chart_data(months=12),
            "bookings_summary": get_bookings_over_time_chart_data(days=30),
            "genre_distribution": get_genre_distribution_chart_data(),
            "ticket_types": get_ticket_types_chart_data(),
            "top_movies": get_movie_ratings_chart_data(),
        }


class ModeratorDashboardView(BaseChartView):
    """API view for the moderator dashboard."""

    def get_chart_data(self, request):
        """Return moderator dashboard data."""
        return {
            "bookings_summary": get_bookings_over_time_chart_data(days=30),
            "genre_distribution": get_genre_distribution_chart_data(),
            "ticket_types": get_ticket_types_chart_data(),
            "top_movies": get_movie_ratings_chart_data(),
        }


class ReportListView(BaseChartView):
    """API view for listing available reports."""

    def get_chart_data(self, request):
        """Return list of available reports."""
        return {
            "reports": [
                {
                    "id": "movies",
                    "name": "Movie Performance Report",
                    "description": "Detailed analysis of movie performances",
                },
                {
                    "id": "sales",
                    "name": "Sales Analysis Report",
                    "description": "Comprehensive breakdown of sales and revenue",
                },
                {
                    "id": "employees",
                    "name": "Employee Performance Report",
                    "description": "Analysis of employee metrics and performance",
                },
            ]
        }


class MovieReportView(BaseChartView):
    """API view for movie-related reports."""

    def get_chart_data(self, request):
        """Return movie report data."""
        return {
            "title": "Movie Performance Report",
            "charts": [
                get_movie_ratings_chart_data(),
                get_genre_distribution_chart_data(),
            ],
            "summary": {
                "total_movies": 150,
                "new_releases": 12,
                "avg_rating": 4.2,
                "top_genre": "Action",
            },
        }


class SalesReportView(BaseChartView):
    """API view for sales-related reports."""

    def get_chart_data(self, request):
        """Return sales report data."""
        return {
            "title": "Sales Analysis Report",
            "charts": [
                get_monthly_revenue_chart_data(months=12),
                get_bookings_over_time_chart_data(days=90),
                get_ticket_types_chart_data(),
            ],
            "summary": {
                "total_revenue": "$1,245,680",
                "total_bookings": 28750,
                "avg_ticket_price": "$18.50",
                "growth_rate": "+12.5%",
            },
        }


class EmployeeReportView(BaseChartView):
    """API view for employee-related reports."""

    def get_chart_data(self, request):
        """Return employee report data."""
        # Sample employee performance data
        return {
            "title": "Employee Performance Report",
            "charts": [
                {
                    "type": "bar",
                    "data": {
                        "labels": ["John", "Sarah", "Michael", "Emily", "David"],
                        "datasets": [
                            {
                                "label": "Bookings Processed",
                                "data": [145, 132, 167, 159, 178],
                                "backgroundColor": "rgba(75, 192, 192, 0.8)",
                            }
                        ],
                    },
                    "options": {"title": {"text": "Bookings Processed by Employee"}},
                },
                {
                    "type": "radar",
                    "data": {
                        "labels": [
                            "Customer Service",
                            "Technical Skills",
                            "Efficiency",
                            "Teamwork",
                            "Attendance",
                        ],
                        "datasets": [
                            {
                                "label": "Team Average",
                                "data": [4.2, 3.8, 4.1, 4.5, 4.7],
                                "backgroundColor": "rgba(54, 162, 235, 0.2)",
                                "borderColor": "rgba(54, 162, 235, 1)",
                            },
                            {
                                "label": "Top Performer",
                                "data": [4.8, 4.5, 4.9, 4.7, 5.0],
                                "backgroundColor": "rgba(255, 99, 132, 0.2)",
                                "borderColor": "rgba(255, 99, 132, 1)",
                            },
                        ],
                    },
                    "options": {"title": {"text": "Performance Metrics"}},
                },
            ],
            "summary": {
                "total_employees": 25,
                "avg_satisfaction": 4.3,
                "top_performer": "David Williams",
                "improvement_areas": "Technical Skills, Efficiency",
            },
        }
