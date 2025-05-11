from django.contrib import admin

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


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name", "description")


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("title", "department", "min_salary", "max_salary")
    list_filter = ("department",)
    search_fields = ("title", "description")


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "position", "hire_date", "current_salary", "is_full_time")
    list_filter = ("position__department", "is_full_time", "hire_date")
    search_fields = ("user__email", "user__first_name", "user__last_name", "tax_id")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Employee Information",
            {"fields": ("user", "position", "hire_date", "current_salary")},
        ),
        (
            "Personal Details",
            {
                "fields": (
                    "bank_account",
                    "tax_id",
                    "emergency_contact_name",
                    "emergency_contact_phone",
                )
            },
        ),
        ("Work Schedule", {"fields": ("weekly_hours", "is_full_time")}),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(SalaryHistory)
class SalaryHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "previous_salary",
        "new_salary",
        "effective_date",
        "reason",
    )
    list_filter = ("reason", "effective_date")
    search_fields = ("employee__user__email", "notes")
    readonly_fields = ("created_at",)


@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "reviewer",
        "review_date",
        "overall_rating",
        "is_acknowledged_by_employee",
    )
    list_filter = ("overall_rating", "review_date", "is_acknowledged_by_employee")
    search_fields = (
        "employee__user__email",
        "reviewer__email",
        "strengths",
        "areas_for_improvement",
    )
    readonly_fields = ("created_at", "updated_at", "average_rating")
    fieldsets = (
        (
            "Review Information",
            {
                "fields": (
                    "employee",
                    "reviewer",
                    "review_date",
                    "review_period_start",
                    "review_period_end",
                )
            },
        ),
        (
            "Performance Ratings",
            {
                "fields": (
                    "productivity_rating",
                    "quality_rating",
                    "communication_rating",
                    "teamwork_rating",
                    "leadership_rating",
                    "overall_rating",
                    "average_rating",
                )
            },
        ),
        (
            "Feedback",
            {
                "fields": (
                    "strengths",
                    "areas_for_improvement",
                    "goals_for_next_period",
                    "employee_comments",
                    "reviewer_comments",
                )
            },
        ),
        (
            "Acknowledgement",
            {"fields": ("is_acknowledged_by_employee", "acknowledged_date")},
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "employee",
        "start_date",
        "end_date",
        "priority",
        "status",
        "completion_percentage",
    )
    list_filter = ("priority", "status", "start_date")
    search_fields = ("title", "description", "employee__user__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "leave_type",
        "start_date",
        "end_date",
        "status",
        "days_requested",
    )
    list_filter = ("leave_type", "status", "start_date")
    search_fields = ("employee__user__email", "reason")
    readonly_fields = ("created_at", "updated_at", "days_requested")
    actions = ["approve_leave", "reject_leave"]

    def approve_leave(self, request, queryset):
        queryset.update(status="APPROVED", approved_by=request.user)

    approve_leave.short_description = "Approve selected leave requests"

    def reject_leave(self, request, queryset):
        queryset.update(status="REJECTED", rejected_reason="Rejected via admin action")

    reject_leave.short_description = "Reject selected leave requests"


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "metric_date",
        "bookings_processed",
        "revenue_generated",
        "customer_satisfaction",
        "task_completion_rate",
    )
    list_filter = ("metric_date", "customer_satisfaction")
    search_fields = ("employee__user__email", "notes")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Employee Information",
            {"fields": ("employee", "metric_date", "recorded_by")},
        ),
        (
            "Performance Metrics",
            {
                "fields": (
                    "bookings_processed",
                    "revenue_generated",
                    "customer_satisfaction",
                    "response_time_minutes",
                    "task_completion_rate",
                )
            },
        ),
        (
            "Additional Information",
            {"fields": ("notes",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )
