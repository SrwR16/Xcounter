from decimal import Decimal

from django.db.models import Avg, Max, Min, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Assignment,
    Department,
    EmployeeProfile,
    Leave,
    PerformanceMetric,
    PerformanceReview,
    Position,
    SalaryHistory,
)
from .serializers import (
    AssignmentSerializer,
    AssignmentUpdateSerializer,
    DepartmentSerializer,
    EmployeeAcknowledgeReviewSerializer,
    EmployeeProfileCreateSerializer,
    EmployeeProfileSerializer,
    EmployeeStatsSerializer,
    LeaveApprovalSerializer,
    LeaveSerializer,
    PerformanceMetricCreateSerializer,
    PerformanceMetricSerializer,
    PerformanceReviewSerializer,
    PositionSerializer,
    SalaryHistorySerializer,
    SalaryUpdateSerializer,
)


class IsAdminOrManager(IsAuthenticated):
    """
    Custom permission to allow admins and managers (moderators) to access/edit.
    """

    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view)
            and (request.user.is_admin or request.user.is_moderator)
        )


class IsOwnerOrAdmin(IsAuthenticated):
    """
    Custom permission to allow owners or admins to access specific objects.
    """

    def has_object_permission(self, request, view, obj):
        # Allow admins and moderators full access
        if request.user.is_admin or request.user.is_moderator:
            return True

        # Check if the object has a user or employee field that links to the requesting user
        if hasattr(obj, "user"):
            return obj.user == request.user
        elif hasattr(obj, "employee") and hasattr(obj.employee, "user"):
            return obj.employee.user == request.user

        return False


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing departments.
    """

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class PositionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing positions.
    """

    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["department"]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "department__name", "min_salary", "max_salary"]
    ordering = ["department__name", "title"]


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing employee profiles.
    """

    queryset = EmployeeProfile.objects.all()
    permission_classes = [IsAdminOrManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["position__department", "is_full_time"]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "position__title",
    ]
    ordering_fields = ["user__email", "hire_date", "current_salary", "position__title"]
    ordering = ["user__email"]

    def get_serializer_class(self):
        if self.action == "create":
            return EmployeeProfileCreateSerializer
        elif self.action == "update_salary":
            return SalaryUpdateSerializer
        return EmployeeProfileSerializer

    @action(detail=True, methods=["post"])
    def update_salary(self, request, pk=None):
        """Update employee's salary and create a salary history record."""
        employee = self.get_object()
        serializer = self.get_serializer(employee, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Salary updated successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalaryHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing salary history (read-only).
    """

    queryset = SalaryHistory.objects.all()
    serializer_class = SalaryHistorySerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["employee", "reason", "effective_date"]
    ordering_fields = ["effective_date", "new_salary"]
    ordering = ["-effective_date"]

    @action(detail=False, methods=["get"])
    def by_employee(self, request):
        """Get salary history for a specific employee."""
        employee_id = request.query_params.get("employee_id")
        if not employee_id:
            return Response(
                {"error": "Employee ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(employee_id=employee_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing performance reviews.
    """

    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "employee",
        "reviewer",
        "review_date",
        "overall_rating",
        "is_acknowledged_by_employee",
    ]
    search_fields = [
        "employee__user__email",
        "reviewer__email",
        "strengths",
        "areas_for_improvement",
    ]
    ordering_fields = ["review_date", "overall_rating"]
    ordering = ["-review_date"]

    def get_queryset(self):
        user = self.request.user

        # Admins and moderators can see all reviews
        if user.is_admin or user.is_moderator:
            return super().get_queryset()

        # Employees can only see their own reviews
        return PerformanceReview.objects.filter(employee__user=user)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def acknowledge(self, request, pk=None):
        """Allow employees to acknowledge their performance review."""
        review = self.get_object()

        # Ensure the review belongs to the requesting user
        if review.employee.user != request.user:
            return Response(
                {"error": "You can only acknowledge your own reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EmployeeAcknowledgeReviewSerializer(review, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Review acknowledged successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing employee assignments.
    """

    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["employee", "priority", "status", "start_date"]
    search_fields = ["title", "description", "employee__user__email"]
    ordering_fields = ["start_date", "priority", "status"]
    ordering = ["-start_date"]

    def get_queryset(self):
        user = self.request.user

        # Admins and moderators can see all assignments
        if user.is_admin or user.is_moderator:
            return super().get_queryset()

        # Regular employees can only see their own assignments
        try:
            employee_profile = EmployeeProfile.objects.get(user=user)
            return Assignment.objects.filter(employee=employee_profile)
        except EmployeeProfile.DoesNotExist:
            return Assignment.objects.none()

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_progress(self, request, pk=None):
        """Update assignment status and progress."""
        assignment = self.get_object()

        # Allow only the assigned employee or admins to update progress
        if (
            not (request.user.is_admin or request.user.is_moderator)
            and assignment.employee.user != request.user
        ):
            return Response(
                {"error": "You can only update your own assignments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AssignmentUpdateSerializer(
            assignment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Assignment updated successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeaveViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing employee leave requests.
    """

    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["employee", "leave_type", "status", "start_date"]
    search_fields = ["employee__user__email", "reason"]
    ordering_fields = ["start_date", "status"]
    ordering = ["-start_date"]

    def get_queryset(self):
        user = self.request.user

        # Admins and moderators can see all leave requests
        if user.is_admin or user.is_moderator:
            return super().get_queryset()

        # Regular employees can only see their own leave requests
        try:
            employee_profile = EmployeeProfile.objects.get(user=user)
            return Leave.objects.filter(employee=employee_profile)
        except EmployeeProfile.DoesNotExist:
            return Leave.objects.none()

    def perform_create(self, serializer):
        # Automatically set the employee based on the authenticated user
        try:
            employee_profile = EmployeeProfile.objects.get(user=self.request.user)
            serializer.save(employee=employee_profile)
        except EmployeeProfile.DoesNotExist:
            raise serializer.ValidationError("Employee profile not found for this user")

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrManager])
    def approve_reject(self, request, pk=None):
        """Approve or reject a leave request."""
        leave = self.get_object()

        serializer = LeaveApprovalSerializer(
            leave, data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": f"Leave request {leave.status.lower()}"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeStatsViewSet(viewsets.ViewSet):
    """
    API endpoint for employee statistics.
    """

    permission_classes = [IsAdminOrManager]

    def list(self, request):
        """Get overall employee statistics."""
        # Count total employees
        total_employees = EmployeeProfile.objects.count()

        # Department distribution
        department_distribution = {}
        departments = Department.objects.all()
        for dept in departments:
            count = EmployeeProfile.objects.filter(position__department=dept).count()
            department_distribution[dept.name] = count

        # Salary statistics
        salary_stats = {
            "average": EmployeeProfile.objects.aggregate(avg=Avg("current_salary"))[
                "avg"
            ]
            or 0,
            "min": EmployeeProfile.objects.aggregate(min=Min("current_salary"))["min"]
            or 0,
            "max": EmployeeProfile.objects.aggregate(max=Max("current_salary"))["max"]
            or 0,
            "total": EmployeeProfile.objects.aggregate(sum=Sum("current_salary"))["sum"]
            or 0,
        }

        # Performance statistics
        latest_reviews = PerformanceReview.objects.filter(
            review_date__gte=timezone.now().date().replace(month=1, day=1)
        )
        performance_stats = {
            "reviews_this_year": latest_reviews.count(),
            "average_rating": latest_reviews.aggregate(avg=Avg("overall_rating"))["avg"]
            or 0,
            "employees_above_expectations": latest_reviews.filter(
                overall_rating__gte=4
            ).count(),
            "employees_below_expectations": latest_reviews.filter(
                overall_rating__lte=2
            ).count(),
        }

        # Leave statistics
        current_year = timezone.now().year
        leave_stats = {
            "pending_requests": Leave.objects.filter(status="PENDING").count(),
            "approved_requests": Leave.objects.filter(status="APPROVED").count(),
            "rejected_requests": Leave.objects.filter(status="REJECTED").count(),
            "total_days_approved": Leave.objects.filter(
                status="APPROVED", start_date__year=current_year
            ).aggregate(days=Sum("days_requested"))["days"]
            or 0,
        }

        # Assignment statistics
        assignment_stats = {
            "total_active": Assignment.objects.exclude(
                status__in=["COMPLETED", "CANCELLED"]
            ).count(),
            "high_priority": Assignment.objects.filter(priority="HIGH")
            .exclude(status__in=["COMPLETED", "CANCELLED"])
            .count(),
            "overdue": Assignment.objects.filter(
                end_date__lt=timezone.now().date(),
                status__in=["NOT_STARTED", "IN_PROGRESS", "ON_HOLD"],
            ).count(),
            "completion_rate": Assignment.objects.filter(status="COMPLETED").count()
            / (Assignment.objects.count() or 1)
            * 100,
        }

        serializer = EmployeeStatsSerializer(
            data={
                "total_employees": total_employees,
                "department_distribution": department_distribution,
                "salary_stats": salary_stats,
                "performance_stats": performance_stats,
                "leave_stats": leave_stats,
                "assignment_stats": assignment_stats,
            }
        )

        serializer.is_valid()  # We're constructing this manually, so it's always valid
        return Response(serializer.data)


class PerformanceMetricViewSet(viewsets.ModelViewSet):
    """
    API endpoint for employee performance metrics.
    """

    queryset = PerformanceMetric.objects.all()
    permission_classes = [IsAdminOrManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["employee", "metric_date"]
    search_fields = ["employee__user__email", "notes"]
    ordering_fields = ["metric_date", "customer_satisfaction", "revenue_generated"]
    ordering = ["-metric_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return PerformanceMetricCreateSerializer
        return PerformanceMetricSerializer

    @action(detail=False, methods=["get"])
    def by_employee(self, request):
        """Get performance metrics for a specific employee."""
        employee_id = request.query_params.get("employee_id")
        if not employee_id:
            return Response(
                {"error": "Employee ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(employee_id=employee_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def trends(self, request):
        """Get performance trends over time for visualization."""
        employee_id = request.query_params.get("employee_id")
        metric = request.query_params.get("metric", "customer_satisfaction")
        days = int(request.query_params.get("days", 30))

        # Validate metric
        valid_metrics = [
            "bookings_processed",
            "revenue_generated",
            "customer_satisfaction",
            "response_time_minutes",
            "task_completion_rate",
        ]

        if metric not in valid_metrics:
            return Response(
                {"error": f"Invalid metric. Choose from {valid_metrics}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate date range
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)

        # Build queryset
        queryset = PerformanceMetric.objects.filter(
            metric_date__gte=start_date, metric_date__lte=end_date
        )

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Group by date and calculate averages
        data = []
        dates = []
        current_date = start_date
        while current_date <= end_date:
            dates.append(current_date)
            current_date += timezone.timedelta(days=1)

        for date in dates:
            day_metrics = queryset.filter(metric_date=date)
            if day_metrics.exists():
                if metric == "revenue_generated":
                    value = (
                        day_metrics.aggregate(Sum(metric))["revenue_generated__sum"]
                        or 0
                    )
                else:
                    value = day_metrics.aggregate(Avg(metric))[f"{metric}__avg"] or 0

                # Convert to float for serialization
                value = float(value) if isinstance(value, Decimal) else value

                data.append(
                    {
                        "date": date.isoformat(),
                        "value": value,
                        "count": day_metrics.count(),
                    }
                )
            else:
                data.append({"date": date.isoformat(), "value": 0, "count": 0})

        return Response(
            {
                "metric": metric,
                "employee_id": employee_id,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "data": data,
            }
        )

    @action(detail=False, methods=["get"])
    def comparison(self, request):
        """Compare metrics across employees for visualization."""
        metric = request.query_params.get("metric", "customer_satisfaction")
        days = int(request.query_params.get("days", 30))
        limit = int(request.query_params.get("limit", 10))

        # Validate metric
        valid_metrics = [
            "bookings_processed",
            "revenue_generated",
            "customer_satisfaction",
            "response_time_minutes",
            "task_completion_rate",
        ]

        if metric not in valid_metrics:
            return Response(
                {"error": f"Invalid metric. Choose from {valid_metrics}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate date range
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)

        # Get top performers based on the metric
        top_employees = (
            EmployeeProfile.objects.filter(
                performance_metrics__metric_date__gte=start_date,
                performance_metrics__metric_date__lte=end_date,
            )
            .annotate(avg_value=Avg(f"performance_metrics__{metric}"))
            .order_by(
                "-avg_value" if metric != "response_time_minutes" else "avg_value"
            )[:limit]
        )

        # Prepare comparison data
        comparison_data = []
        for employee in top_employees:
            avg_value = employee.avg_value
            metrics_count = employee.performance_metrics.filter(
                metric_date__gte=start_date, metric_date__lte=end_date
            ).count()

            if avg_value is not None:
                # Convert to float for serialization
                avg_value = (
                    float(avg_value) if isinstance(avg_value, Decimal) else avg_value
                )

                comparison_data.append(
                    {
                        "employee_id": employee.id,
                        "employee_name": employee.user.get_full_name()
                        or employee.user.email,
                        "value": avg_value,
                        "metrics_count": metrics_count,
                    }
                )

        return Response(
            {
                "metric": metric,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "data": comparison_data,
            }
        )
