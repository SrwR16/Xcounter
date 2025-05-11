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
