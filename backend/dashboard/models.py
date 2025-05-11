from django.db import models
from django.utils import timezone

from users.models import CustomUser


class Metric(models.Model):
    """
    Model to represent a metric to be displayed on dashboards.
    Metrics can be displayed in different ways (number, text, chart)
    and can be configured for different user roles.
    """

    class Category(models.TextChoices):
        SALES = "SALES", "Sales"
        PERFORMANCE = "PERFORMANCE", "Performance"
        CUSTOMER = "CUSTOMER", "Customer"
        INVENTORY = "INVENTORY", "Inventory"
        EMPLOYEE = "EMPLOYEE", "Employee"
        SYSTEM = "SYSTEM", "System"

    class DisplayType(models.TextChoices):
        NUMBER = "NUMBER", "Number"
        CURRENCY = "CURRENCY", "Currency"
        PERCENTAGE = "PERCENTAGE", "Percentage"
        TEXT = "TEXT", "Text"
        CHART_LINE = "CHART_LINE", "Line Chart"
        CHART_BAR = "CHART_BAR", "Bar Chart"
        CHART_PIE = "CHART_PIE", "Pie Chart"

    class RefreshFrequency(models.TextChoices):
        HOURLY = "HOURLY", "Hourly"
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    display_type = models.CharField(max_length=20, choices=DisplayType.choices)
    calculation_method = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    refresh_frequency = models.CharField(
        max_length=20, choices=RefreshFrequency.choices
    )

    # Role visibility
    for_admins = models.BooleanField(default=True)
    for_moderators = models.BooleanField(default=True)
    for_salesmen = models.BooleanField(default=False)
    for_customers = models.BooleanField(default=False)

    # Display settings
    display_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["display_order", "name"]


class MetricValue(models.Model):
    """
    Stores actual values for metrics over time.
    Each metric can have different value types based on its display_type.
    """

    metric = models.ForeignKey(Metric, on_delete=models.CASCADE, related_name="values")
    timestamp = models.DateTimeField(default=timezone.now)

    # Different value types
    numeric_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    string_value = models.TextField(null=True, blank=True)
    json_value = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        get_latest_by = "timestamp"

    def __str__(self):
        return f"{self.metric.name} - {self.timestamp}"


class DashboardLayout(models.Model):
    """
    Stores user-specific dashboard layouts and preferences.
    The layout_data field stores JSON with widget positions, sizes, etc.
    """

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="dashboard_layout"
    )
    layout_data = models.JSONField(default=dict)
    last_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dashboard layout for {self.user.email}"


class ReportTemplate(models.Model):
    """
    Defines templates for generating PDF reports.
    Templates can have different types and visibility settings.
    """

    class ReportType(models.TextChoices):
        SALES = "SALES", "Sales Report"
        EMPLOYEE = "EMPLOYEE", "Employee Report"
        MOVIES = "MOVIES", "Movies and Shows Report"
        FINANCE = "FINANCE", "Financial Report"
        PERFORMANCE = "PERFORMANCE", "Performance Report"
        CUSTOM = "CUSTOM", "Custom Report"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    template_data = models.JSONField(null=True, blank=True)

    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_templates",
    )
    is_default = models.BooleanField(default=False)

    # Role visibility
    for_admins = models.BooleanField(default=True)
    for_moderators = models.BooleanField(default=True)
    for_salesmen = models.BooleanField(default=False)
    for_customers = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class GeneratedReport(models.Model):
    """
    Stores information about generated reports.
    """

    class Status(models.TextChoices):
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    template = models.ForeignKey(
        ReportTemplate, on_delete=models.CASCADE, related_name="generated_reports"
    )
    name = models.CharField(max_length=200)
    parameters = models.JSONField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default="PROCESSING"
    )
    error_message = models.TextField(blank=True)

    file = models.FileField(upload_to="reports/", null=True, blank=True)
    generated_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="generated_reports",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_file_size(self):
        if self.file:
            return self.file.size
        return 0
