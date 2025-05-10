from django.db import transaction
from rest_framework import serializers

from users.models import CustomUser, UserProfile

from .models import (
    Assignment,
    Department,
    EmployeeProfile,
    Leave,
    PerformanceReview,
    Position,
    SalaryHistory,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source="department.name")

    class Meta:
        model = Position
        fields = [
            "id",
            "title",
            "department",
            "department_name",
            "description",
            "min_salary",
            "max_salary",
            "created_at",
            "updated_at",
        ]


class EmployeeProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.profile.full_name", read_only=True)
    position_title = serializers.ReadOnlyField(source="position.title")
    department_name = serializers.ReadOnlyField(source="position.department.name")

    class Meta:
        model = EmployeeProfile
        fields = [
            "id",
            "user",
            "email",
            "full_name",
            "position",
            "position_title",
            "department_name",
            "hire_date",
            "current_salary",
            "bank_account",
            "tax_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "weekly_hours",
            "is_full_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class EmployeeProfileCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = EmployeeProfile
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "position",
            "hire_date",
            "current_salary",
            "bank_account",
            "tax_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "weekly_hours",
            "is_full_time",
        ]

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        password = validated_data.pop("password")

        # Determine role based on position
        position = validated_data.get("position")
        # Default to SALESMAN, but could be determined by position title/department logic
        role = "SALESMAN"

        # Create user account
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )

        # Create or update user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.full_name = f"{first_name} {last_name}"
        profile.employee_id = f"EMP-{user.id:06d}"  # Format: EMP-000123
        profile.hire_date = validated_data.get("hire_date")
        profile.save()

        # Create employee profile
        employee_profile = EmployeeProfile.objects.create(user=user, **validated_data)

        return employee_profile


class SalaryHistorySerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source="employee.user.email")
    approver_email = serializers.ReadOnlyField(source="approved_by.email")

    class Meta:
        model = SalaryHistory
        fields = [
            "id",
            "employee",
            "employee_email",
            "previous_salary",
            "new_salary",
            "effective_date",
            "reason",
            "notes",
            "approved_by",
            "approver_email",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class SalaryUpdateSerializer(serializers.Serializer):
    new_salary = serializers.DecimalField(max_digits=10, decimal_places=2)
    reason = serializers.ChoiceField(
        choices=[
            ("PROMOTION", "Promotion"),
            ("ANNUAL_REVIEW", "Annual Review"),
            ("PERFORMANCE", "Performance Based"),
            ("ADJUSTMENT", "Market Adjustment"),
            ("OTHER", "Other"),
        ]
    )
    effective_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)

    @transaction.atomic
    def update(self, instance, validated_data):
        new_salary = validated_data.get("new_salary")
        previous_salary = instance.current_salary

        # Create salary history record
        SalaryHistory.objects.create(
            employee=instance,
            previous_salary=previous_salary,
            new_salary=new_salary,
            effective_date=validated_data.get("effective_date"),
            reason=validated_data.get("reason"),
            notes=validated_data.get("notes", ""),
            approved_by=self.context["request"].user,
        )

        # Update employee's current salary
        instance.current_salary = new_salary
        instance.save()

        return instance


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source="employee.user.email")
    reviewer_email = serializers.ReadOnlyField(source="reviewer.email")
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = PerformanceReview
        fields = [
            "id",
            "employee",
            "employee_email",
            "reviewer",
            "reviewer_email",
            "review_date",
            "review_period_start",
            "review_period_end",
            "productivity_rating",
            "quality_rating",
            "communication_rating",
            "teamwork_rating",
            "leadership_rating",
            "overall_rating",
            "average_rating",
            "strengths",
            "areas_for_improvement",
            "goals_for_next_period",
            "employee_comments",
            "reviewer_comments",
            "is_acknowledged_by_employee",
            "acknowledged_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "average_rating"]


class EmployeeAcknowledgeReviewSerializer(serializers.Serializer):
    employee_comments = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        from django.utils import timezone

        instance.employee_comments = validated_data.get(
            "employee_comments", instance.employee_comments
        )
        instance.is_acknowledged_by_employee = True
        instance.acknowledged_date = timezone.now().date()
        instance.save()

        return instance


class AssignmentSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source="employee.user.email")
    assigned_by_email = serializers.ReadOnlyField(source="assigned_by.email")

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "employee",
            "employee_email",
            "assigned_by",
            "assigned_by_email",
            "start_date",
            "end_date",
            "priority",
            "status",
            "completion_percentage",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "assigned_by"]

    def create(self, validated_data):
        validated_data["assigned_by"] = self.context["request"].user
        return super().create(validated_data)


class AssignmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["status", "completion_percentage", "notes"]


class LeaveSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source="employee.user.email")
    approver_email = serializers.ReadOnlyField(source="approved_by.email")
    days_requested = serializers.IntegerField(read_only=True)

    class Meta:
        model = Leave
        fields = [
            "id",
            "employee",
            "employee_email",
            "leave_type",
            "start_date",
            "end_date",
            "reason",
            "status",
            "approved_by",
            "approver_email",
            "rejected_reason",
            "days_requested",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "status",
            "approved_by",
            "rejected_reason",
        ]


class LeaveApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    reason = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        instance.status = validated_data.get("status")

        if instance.status == "REJECTED":
            instance.rejected_reason = validated_data.get("reason", "")

        instance.approved_by = self.context["request"].user
        instance.save()

        return instance


class EmployeeStatsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    department_distribution = serializers.DictField()
    salary_stats = serializers.DictField()
    performance_stats = serializers.DictField()
    leave_stats = serializers.DictField()
    assignment_stats = serializers.DictField()
