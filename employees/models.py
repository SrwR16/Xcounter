from decimal import Decimal

from django.db import models
from django.utils import timezone

from users.models import CustomUser


class Department(models.Model):
    """Department model to organize employees."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Position(models.Model):
    """Position model to define roles and salary ranges."""

    title = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="positions"
    )
    description = models.TextField(blank=True)
    min_salary = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    max_salary = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.department.name})"


class EmployeeProfile(models.Model):
    """Extended profile for employees with job-specific information."""

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="employee_profile"
    )
    position = models.ForeignKey(
        Position, on_delete=models.SET_NULL, null=True, related_name="employees"
    )
    hire_date = models.DateField(default=timezone.now)
    current_salary = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    bank_account = models.CharField(max_length=50, blank=True)
    tax_id = models.CharField(max_length=20, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Work schedule information
    weekly_hours = models.PositiveIntegerField(default=40)
    is_full_time = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.position.title if self.position else 'No Position'}"


class SalaryHistory(models.Model):
    """Track salary changes over time."""

    employee = models.ForeignKey(
        EmployeeProfile, on_delete=models.CASCADE, related_name="salary_history"
    )
    previous_salary = models.DecimalField(max_digits=10, decimal_places=2)
    new_salary = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.DateField()
    reason = models.CharField(
        max_length=100,
        choices=[
            ("PROMOTION", "Promotion"),
            ("ANNUAL_REVIEW", "Annual Review"),
            ("PERFORMANCE", "Performance Based"),
            ("ADJUSTMENT", "Market Adjustment"),
            ("OTHER", "Other"),
        ],
    )
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approved_salary_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.user.email} - {self.effective_date} - {self.new_salary}"


class PerformanceReview(models.Model):
    """Employee performance review model."""

    RATING_CHOICES = [
        (1, "Poor"),
        (2, "Below Expectations"),
        (3, "Meets Expectations"),
        (4, "Exceeds Expectations"),
        (5, "Outstanding"),
    ]

    employee = models.ForeignKey(
        EmployeeProfile, on_delete=models.CASCADE, related_name="performance_reviews"
    )
    reviewer = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="conducted_reviews"
    )
    review_date = models.DateField()
    review_period_start = models.DateField()
    review_period_end = models.DateField()

    # Performance metrics
    productivity_rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    quality_rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    communication_rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    teamwork_rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    leadership_rating = models.PositiveIntegerField(
        choices=RATING_CHOICES, null=True, blank=True
    )

    overall_rating = models.PositiveIntegerField(choices=RATING_CHOICES)

    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    goals_for_next_period = models.TextField(blank=True)

    employee_comments = models.TextField(blank=True)
    reviewer_comments = models.TextField(blank=True)

    is_acknowledged_by_employee = models.BooleanField(default=False)
    acknowledged_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.email} - {self.review_date} - {self.get_overall_rating_display()}"

    @property
    def average_rating(self):
        """Calculate the average of all applicable ratings."""
        ratings = [
            self.productivity_rating,
            self.quality_rating,
            self.communication_rating,
            self.teamwork_rating,
        ]

        if self.leadership_rating:
            ratings.append(self.leadership_rating)

        return sum(ratings) / len(ratings)


class Assignment(models.Model):
    """Employee assignment to specific tasks or projects."""

    title = models.CharField(max_length=200)
    description = models.TextField()

    employee = models.ForeignKey(
        EmployeeProfile, on_delete=models.CASCADE, related_name="assignments"
    )
    assigned_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="assigned_tasks"
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    priority = models.CharField(
        max_length=20,
        choices=[
            ("LOW", "Low"),
            ("MEDIUM", "Medium"),
            ("HIGH", "High"),
            ("URGENT", "Urgent"),
        ],
        default="MEDIUM",
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("NOT_STARTED", "Not Started"),
            ("IN_PROGRESS", "In Progress"),
            ("ON_HOLD", "On Hold"),
            ("COMPLETED", "Completed"),
            ("CANCELLED", "Cancelled"),
        ],
        default="NOT_STARTED",
    )

    completion_percentage = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.employee.user.email}"


class Leave(models.Model):
    """Employee leave tracking."""

    LEAVE_TYPES = [
        ("VACATION", "Vacation"),
        ("SICK", "Sick Leave"),
        ("PERSONAL", "Personal Leave"),
        ("UNPAID", "Unpaid Leave"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CANCELLED", "Cancelled"),
    ]

    employee = models.ForeignKey(
        EmployeeProfile, on_delete=models.CASCADE, related_name="leaves"
    )
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leaves",
    )
    rejected_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.email} - {self.leave_type} ({self.start_date} to {self.end_date})"

    @property
    def days_requested(self):
        """Calculate the number of days requested for leave."""
        delta = self.end_date - self.start_date
        return delta.days + 1  # Include both start and end days
