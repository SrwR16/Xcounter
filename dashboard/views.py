import logging
from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking, Ticket
from coupons.models import Coupon
from employees.models import EmployeeProfile, PerformanceReview
from movies.models import Movie, Show, Theater
from users.models import CustomUser

from .models import (
    DashboardLayout,
    GeneratedReport,
    Metric,
    MetricValue,
    ReportTemplate,
)
from .report_generators import generate_report_pdf
from .serializers import (
    DashboardLayoutSerializer,
    DashboardMetricsSerializer,
    GeneratedReportSerializer,
    MetricDetailSerializer,
    MetricSerializer,
    MetricValueSerializer,
    ReportGenerationSerializer,
    ReportTemplateSerializer,
)

logger = logging.getLogger(__name__)


class IsAdminOrModerator(IsAuthenticated):
    """
    Custom permission to allow only admin and moderator users access.
    """

    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view)
            and (request.user.is_admin or request.user.is_moderator)
        )


class MetricViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing dashboard metrics.
    """

    queryset = Metric.objects.all()
    permission_classes = [IsAdminOrModerator]

    def get_serializer_class(self):
        if (
            self.action == "retrieve"
            or self.action == "create"
            or self.action == "update"
        ):
            return MetricDetailSerializer
        return MetricSerializer

    def get_queryset(self):
        user = self.request.user

        # Filter metrics based on user role
        if user.is_admin:
            return Metric.objects.filter(for_admins=True)
        elif user.is_moderator:
            return Metric.objects.filter(for_moderators=True)
        elif user.is_salesman:
            return Metric.objects.filter(for_salesmen=True)
        else:  # customer
            return Metric.objects.filter(for_customers=True)

    @action(detail=True, methods=["get"])
    def values(self, request, pk=None):
        """Get historical values for a specific metric."""
        metric = self.get_object()

        # Get date range from query parameters or use default (last 30 days)
        days = int(request.query_params.get("days", 30))
        start_date = timezone.now() - timedelta(days=days)

        values = MetricValue.objects.filter(
            metric=metric, timestamp__gte=start_date
        ).order_by("timestamp")

        serializer = MetricValueSerializer(values, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def calculate(self, request, pk=None):
        """Manually trigger metric calculation."""
        metric = self.get_object()

        try:
            # Calculate the metric value based on its calculation method
            calculator = MetricCalculator()
            value = calculator.calculate_metric(metric)

            if value is not None:
                return Response(
                    {
                        "message": f'Metric "{metric.name}" calculated successfully',
                        "value": value,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": f'Failed to calculate metric "{metric.name}"'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Error calculating metric {metric.id}: {str(e)}")
            return Response(
                {"error": f"Error calculating metric: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MetricValueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for accessing metric values (read-only).
    """

    serializer_class = MetricValueSerializer
    permission_classes = [IsAdminOrModerator]

    def get_queryset(self):
        # Get all metrics the user has access to
        user = self.request.user
        if user.is_admin:
            metrics = Metric.objects.filter(for_admins=True)
        elif user.is_moderator:
            metrics = Metric.objects.filter(for_moderators=True)
        elif user.is_salesman:
            metrics = Metric.objects.filter(for_salesmen=True)
        else:  # customer
            metrics = Metric.objects.filter(for_customers=True)

        # Filter metric values by these metrics
        return MetricValue.objects.filter(metric__in=metrics)


class DashboardLayoutViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user dashboard layouts.
    """

    serializer_class = DashboardLayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own dashboard layout
        return DashboardLayout.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my_layout(self, request):
        """Get the current user's dashboard layout."""
        user = request.user

        try:
            layout = DashboardLayout.objects.get(user=user)
            serializer = self.get_serializer(layout)
            return Response(serializer.data)
        except DashboardLayout.DoesNotExist:
            # Return empty layout if none exists
            return Response({"layout_data": {}, "last_modified": None})


class DashboardMetricsView(APIView):
    """
    API endpoint for getting all metrics and their current values for a dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get metrics based on user role
        if user.is_admin:
            metrics = Metric.objects.filter(for_admins=True, is_active=True)
        elif user.is_moderator:
            metrics = Metric.objects.filter(for_moderators=True, is_active=True)
        elif user.is_salesman:
            metrics = Metric.objects.filter(for_salesmen=True, is_active=True)
        else:  # customer
            metrics = Metric.objects.filter(for_customers=True, is_active=True)

        # Get the latest value for each metric
        metric_values = {}
        for metric in metrics:
            try:
                latest_value = MetricValue.objects.filter(metric=metric).latest(
                    "timestamp"
                )

                value_data = {
                    "timestamp": latest_value.timestamp,
                }

                # Include the appropriate value based on display type
                if metric.display_type in ["NUMBER", "CURRENCY", "PERCENTAGE"]:
                    value_data["value"] = latest_value.numeric_value
                elif metric.display_type == "TEXT":
                    value_data["value"] = latest_value.string_value
                elif metric.display_type in ["CHART_LINE", "CHART_BAR", "CHART_PIE"]:
                    value_data["value"] = latest_value.json_value

                metric_values[metric.id] = value_data

            except MetricValue.DoesNotExist:
                # No value exists for this metric
                metric_values[metric.id] = {"timestamp": None, "value": None}

        # Return metrics and their values
        serializer = DashboardMetricsSerializer(
            {"metrics": metrics, "values": metric_values}
        )
        return Response(serializer.data)


class RoleBasedDashboardView(APIView):
    """
    View to provide role-specific dashboard data.
    Returns different sets of metrics based on the user's role.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        try:
            user = request.user

            # Determine role-specific metrics
            if user.is_staff:
                # Admin dashboard
                response_data = self.get_admin_dashboard_data(request)
            elif user.is_moderator:
                # Moderator dashboard
                response_data = self.get_moderator_dashboard_data(request)
            elif user.is_salesman:
                # Salesman dashboard
                response_data = self.get_salesman_dashboard_data(request)
            else:
                # Customer dashboard
                response_data = self.get_customer_dashboard_data(request)

            return Response(response_data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_admin_dashboard_data(self, request):
        """Get dashboard data for admin users"""
        # Get metrics visible to admins
        metrics = Metric.objects.filter(for_admins=True)

        # Get the latest value for each metric
        metrics_data = []
        for metric in metrics:
            latest_value = (
                MetricValue.objects.filter(metric=metric).order_by("-timestamp").first()
            )

            metric_data = {
                "id": metric.id,
                "name": metric.name,
                "description": metric.description,
                "category": metric.category,
                "display_type": metric.display_type,
            }

            if latest_value:
                if metric.display_type in [
                    Metric.DisplayType.NUMBER,
                    Metric.DisplayType.CURRENCY,
                    Metric.DisplayType.PERCENTAGE,
                ]:
                    metric_data["value"] = latest_value.numeric_value
                elif metric.display_type == Metric.DisplayType.TEXT:
                    metric_data["value"] = latest_value.string_value
                elif "CHART" in metric.display_type:  # Handle all chart types
                    metric_data["value"] = latest_value.json_value
                metric_data["timestamp"] = latest_value.timestamp

            metrics_data.append(metric_data)

        # Organize metrics by category
        categories = {}
        for metric in metrics_data:
            category = metric["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(metric)

        return {"role": "admin", "categories": categories}

    def get_moderator_dashboard_data(self, request):
        """Get dashboard data for moderator users"""
        # Get metrics visible to moderators
        metrics = Metric.objects.filter(for_moderators=True)

        # Get the latest value for each metric
        metrics_data = []
        for metric in metrics:
            latest_value = (
                MetricValue.objects.filter(metric=metric).order_by("-timestamp").first()
            )

            metric_data = {
                "id": metric.id,
                "name": metric.name,
                "description": metric.description,
                "category": metric.category,
                "display_type": metric.display_type,
            }

            if latest_value:
                if metric.display_type in [
                    Metric.DisplayType.NUMBER,
                    Metric.DisplayType.CURRENCY,
                    Metric.DisplayType.PERCENTAGE,
                ]:
                    metric_data["value"] = latest_value.numeric_value
                elif metric.display_type == Metric.DisplayType.TEXT:
                    metric_data["value"] = latest_value.string_value
                elif "CHART" in metric.display_type:  # Handle all chart types
                    metric_data["value"] = latest_value.json_value
                metric_data["timestamp"] = latest_value.timestamp

            metrics_data.append(metric_data)

        # Organize metrics by category
        categories = {}
        for metric in metrics_data:
            category = metric["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(metric)

        return {"role": "moderator", "categories": categories}

    def get_salesman_dashboard_data(self, request):
        """Get dashboard data for salesman users"""
        # Get metrics visible to salesmen
        metrics = Metric.objects.filter(for_salesmen=True)

        # Get the latest value for each metric
        metrics_data = []
        for metric in metrics:
            latest_value = (
                MetricValue.objects.filter(metric=metric).order_by("-timestamp").first()
            )

            metric_data = {
                "id": metric.id,
                "name": metric.name,
                "description": metric.description,
                "category": metric.category,
                "display_type": metric.display_type,
            }

            if latest_value:
                if metric.display_type in [
                    Metric.DisplayType.NUMBER,
                    Metric.DisplayType.CURRENCY,
                    Metric.DisplayType.PERCENTAGE,
                ]:
                    metric_data["value"] = latest_value.numeric_value
                elif metric.display_type == Metric.DisplayType.TEXT:
                    metric_data["value"] = latest_value.string_value
                elif "CHART" in metric.display_type:  # Handle all chart types
                    metric_data["value"] = latest_value.json_value
                metric_data["timestamp"] = latest_value.timestamp

            metrics_data.append(metric_data)

        # Organize metrics by category
        categories = {}
        for metric in metrics_data:
            category = metric["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(metric)

        return {"role": "salesman", "categories": categories}

    def get_customer_dashboard_data(self, request):
        """Get dashboard data for customer users"""
        # Get metrics visible to customers
        metrics = Metric.objects.filter(for_customers=True)

        # Get the latest value for each metric
        metrics_data = []
        for metric in metrics:
            latest_value = (
                MetricValue.objects.filter(metric=metric).order_by("-timestamp").first()
            )

            metric_data = {
                "id": metric.id,
                "name": metric.name,
                "description": metric.description,
                "category": metric.category,
                "display_type": metric.display_type,
            }

            if latest_value:
                if metric.display_type in [
                    Metric.DisplayType.NUMBER,
                    Metric.DisplayType.CURRENCY,
                    Metric.DisplayType.PERCENTAGE,
                ]:
                    metric_data["value"] = latest_value.numeric_value
                elif metric.display_type == Metric.DisplayType.TEXT:
                    metric_data["value"] = latest_value.string_value
                elif "CHART" in metric.display_type:  # Handle all chart types
                    metric_data["value"] = latest_value.json_value
                metric_data["timestamp"] = latest_value.timestamp

            metrics_data.append(metric_data)

        # Organize metrics by category
        categories = {}
        for metric in metrics_data:
            category = metric["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(metric)

        return {"role": "customer", "categories": categories}


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report templates.
    """

    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAdminOrModerator]

    def get_queryset(self):
        user = self.request.user

        # Filter templates based on user role
        if user.is_admin:
            return ReportTemplate.objects.filter(for_admins=True)
        elif user.is_moderator:
            return ReportTemplate.objects.filter(for_moderators=True)
        elif user.is_salesman:
            return ReportTemplate.objects.filter(for_salesmen=True)
        else:  # customer
            return ReportTemplate.objects.filter(for_customers=True)


class GeneratedReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing generated reports.
    """

    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_admin or user.is_moderator:
            # Admins and moderators can see all reports
            return GeneratedReport.objects.all()
        else:
            # Regular users can only see their own reports
            return GeneratedReport.objects.filter(generated_by=user)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download the generated report file."""
        report = self.get_object()

        if not report.file:
            return Response(
                {"error": "Report file not available"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            with open(report.file.path, "rb") as f:
                file_data = f.read()

            response = HttpResponse(file_data, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="{report.name}.pdf"'
            )
            return response
        except Exception as e:
            logger.error(f"Error downloading report {report.id}: {str(e)}")
            return Response(
                {"error": "Error downloading report file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GenerateReportView(APIView):
    """
    API endpoint for generating a new report.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReportGenerationSerializer(data=request.data)

        if serializer.is_valid():
            template_id = serializer.validated_data["template_id"]
            name = serializer.validated_data["name"]
            parameters = serializer.validated_data["parameters"]

            # Get the template
            try:
                template = ReportTemplate.objects.get(id=template_id)

                # Check if the user has permission to use this template
                user = request.user
                if (
                    (user.is_admin and template.for_admins)
                    or (user.is_moderator and template.for_moderators)
                    or (user.is_salesman and template.for_salesmen)
                    or (user.is_customer and template.for_customers)
                ):
                    # Create report record
                    report = GeneratedReport.objects.create(
                        template=template,
                        name=name,
                        parameters=parameters,
                        generated_by=user,
                        status="PROCESSING",
                    )

                    try:
                        # Generate the report
                        generate_report_pdf(report)

                        # Return the created report details
                        report_serializer = GeneratedReportSerializer(
                            report, context={"request": request}
                        )
                        return Response(
                            report_serializer.data, status=status.HTTP_201_CREATED
                        )

                    except Exception as e:
                        logger.error(f"Error generating report: {str(e)}")
                        report.status = "FAILED"
                        report.error_message = str(e)
                        report.save()
                        return Response(
                            {"error": f"Error generating report: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                else:
                    return Response(
                        {
                            "error": "You do not have permission to use this report template"
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            except ReportTemplate.DoesNotExist:
                return Response(
                    {"error": "Report template not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MetricCalculator:
    """
    Helper class to calculate metric values based on their calculation method.
    This allows for complex metrics to be calculated dynamically.
    """

    def calculate_metric(self, metric):
        """Calculate a metric value based on its category and name."""
        if not metric.is_active:
            return None

        # Sales metrics
        if metric.category == "SALES":
            return self._calculate_sales_metric(metric)

        # Performance metrics
        elif metric.category == "PERFORMANCE":
            return self._calculate_performance_metric(metric)

        # Customer metrics
        elif metric.category == "CUSTOMER":
            return self._calculate_customer_metric(metric)

        # Inventory metrics
        elif metric.category == "INVENTORY":
            return self._calculate_inventory_metric(metric)

        # Employee metrics
        elif metric.category == "EMPLOYEE":
            return self._calculate_employee_metric(metric)

        # System metrics
        elif metric.category == "SYSTEM":
            return self._calculate_system_metric(metric)

        return None

    def _calculate_sales_metric(self, metric):
        """Calculate sales-related metrics."""
        if "total_sales" in metric.name.lower():
            # Total sales (all time)
            total = (
                Booking.objects.exclude(status="CANCELLED").aggregate(
                    total=Sum("total_amount")
                )["total"]
                or 0
            )

            self._store_metric_value(metric, numeric_value=total)
            return total

        elif "monthly_sales" in metric.name.lower():
            # Monthly sales
            start_date = timezone.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            total = (
                Booking.objects.filter(
                    created_at__gte=start_date, status__in=["CONFIRMED", "COMPLETED"]
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )

            self._store_metric_value(metric, numeric_value=total)
            return total

        elif "daily_sales" in metric.name.lower():
            # Daily sales
            today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            total = (
                Booking.objects.filter(
                    created_at__gte=today, status__in=["CONFIRMED", "COMPLETED"]
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )

            self._store_metric_value(metric, numeric_value=total)
            return total

        elif "tickets_sold" in metric.name.lower():
            # Total tickets sold
            count = Ticket.objects.count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "coupon_usage" in metric.name.lower():
            # Coupon usage statistics
            coupons = Coupon.objects.annotate(usage_count=Count("usages"))
            data = {
                "labels": [coupon.code for coupon in coupons],
                "data": [coupon.usage_count for coupon in coupons],
            }

            self._store_metric_value(metric, json_value=data)
            return data

        return None

    def _calculate_performance_metric(self, metric):
        """Calculate performance-related metrics."""
        if "popular_movies" in metric.name.lower():
            # Most popular movies by ticket sales
            movies = Movie.objects.annotate(
                ticket_count=Count("shows__bookings__tickets")
            ).order_by("-ticket_count")[:5]

            data = {
                "labels": [movie.title for movie in movies],
                "data": [movie.ticket_count for movie in movies],
            }

            self._store_metric_value(metric, json_value=data)
            return data

        elif "theater_utilization" in metric.name.lower():
            # Theater utilization
            theaters = Theater.objects.all()
            utilization_data = []

            for theater in theaters:
                total_capacity = theater.capacity * theater.shows.count()
                if total_capacity > 0:
                    tickets_sold = Ticket.objects.filter(
                        booking__show__theater=theater
                    ).count()
                    utilization = (tickets_sold / total_capacity) * 100
                    utilization_data.append(
                        {"theater": theater.name, "utilization": utilization}
                    )

            data = {
                "labels": [item["theater"] for item in utilization_data],
                "data": [item["utilization"] for item in utilization_data],
            }

            self._store_metric_value(metric, json_value=data)
            return data

        return None

    def _calculate_customer_metric(self, metric):
        """Calculate customer-related metrics."""
        if "total_customers" in metric.name.lower():
            # Total customer count
            count = CustomUser.objects.filter(role="CUSTOMER").count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "new_customers" in metric.name.lower():
            # New customers in the last 30 days
            start_date = timezone.now() - timedelta(days=30)
            count = CustomUser.objects.filter(
                role="CUSTOMER", date_joined__gte=start_date
            ).count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "customer_retention" in metric.name.lower():
            # Customer retention rate (customers with > 1 booking)
            total_customers = CustomUser.objects.filter(role="CUSTOMER").count()
            if total_customers > 0:
                repeat_customers = (
                    CustomUser.objects.filter(role="CUSTOMER", bookings__isnull=False)
                    .annotate(booking_count=Count("bookings"))
                    .filter(booking_count__gt=1)
                    .count()
                )

                retention_rate = (repeat_customers / total_customers) * 100

                self._store_metric_value(metric, numeric_value=retention_rate)
                return retention_rate

            return 0

        return None

    def _calculate_inventory_metric(self, metric):
        """Calculate inventory-related metrics."""
        if "active_movies" in metric.name.lower():
            # Number of active movies
            count = Movie.objects.filter(is_active=True).count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "upcoming_shows" in metric.name.lower():
            # Number of upcoming shows
            count = Show.objects.filter(start_time__gte=timezone.now()).count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        return None

    def _calculate_employee_metric(self, metric):
        """Calculate employee-related metrics."""
        if "total_employees" in metric.name.lower():
            # Total employee count
            count = EmployeeProfile.objects.count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "department_distribution" in metric.name.lower():
            # Employee distribution by department
            from employees.models import Department

            departments = Department.objects.annotate(
                employee_count=Count("positions__employees")
            )

            data = {
                "labels": [dept.name for dept in departments],
                "data": [dept.employee_count for dept in departments],
            }

            self._store_metric_value(metric, json_value=data)
            return data

        elif "average_salary" in metric.name.lower():
            # Average employee salary
            avg_salary = (
                EmployeeProfile.objects.aggregate(avg=Avg("current_salary"))["avg"] or 0
            )

            self._store_metric_value(metric, numeric_value=avg_salary)
            return avg_salary

        elif "performance_ratings" in metric.name.lower():
            # Average performance ratings
            avg_rating = (
                PerformanceReview.objects.aggregate(avg=Avg("overall_rating"))["avg"]
                or 0
            )

            self._store_metric_value(metric, numeric_value=avg_rating)
            return avg_rating

        return None

    def _calculate_system_metric(self, metric):
        """Calculate system-related metrics."""
        if "active_users" in metric.name.lower():
            # Count of active users
            count = CustomUser.objects.filter(is_active=True).count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        elif "admin_users" in metric.name.lower():
            # Count of admin users
            count = CustomUser.objects.filter(role="ADMIN").count()

            self._store_metric_value(metric, numeric_value=count)
            return count

        return None

    def _store_metric_value(
        self, metric, numeric_value=None, string_value=None, json_value=None
    ):
        """Store the calculated metric value in the database."""
        MetricValue.objects.create(
            metric=metric,
            numeric_value=numeric_value,
            string_value=string_value,
            json_value=json_value,
        )
