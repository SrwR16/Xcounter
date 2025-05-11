from django.contrib import admin

from .models import (
    DashboardLayout,
    GeneratedReport,
    Metric,
    MetricValue,
    ReportTemplate,
)


@admin.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "display_type",
        "is_active",
        "refresh_frequency",
    )
    list_filter = (
        "category",
        "display_type",
        "is_active",
        "for_admins",
        "for_moderators",
        "for_salesmen",
        "for_customers",
    )
    search_fields = ("name", "description", "calculation_method")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "category",
                    "display_type",
                    "calculation_method",
                    "is_active",
                )
            },
        ),
        ("Refresh Settings", {"fields": ("refresh_frequency",)}),
        (
            "Visibility",
            {
                "fields": (
                    "for_admins",
                    "for_moderators",
                    "for_salesmen",
                    "for_customers",
                )
            },
        ),
        ("Display Settings", {"fields": ("display_order",)}),
    )


@admin.register(MetricValue)
class MetricValueAdmin(admin.ModelAdmin):
    list_display = ("metric", "timestamp", "display_value")
    list_filter = ("metric", "timestamp")
    date_hierarchy = "timestamp"

    def display_value(self, obj):
        """Return the appropriate value based on the metric's display type."""
        metric_type = obj.metric.display_type
        if metric_type in ["NUMBER", "CURRENCY", "PERCENTAGE"]:
            return obj.numeric_value
        elif metric_type == "TEXT":
            return obj.string_value
        elif metric_type in ["CHART_LINE", "CHART_BAR", "CHART_PIE"]:
            return "Chart Data"
        return None

    display_value.short_description = "Value"


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    list_display = ("user", "last_modified")
    search_fields = ("user__email",)
    readonly_fields = ("last_modified",)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "report_type", "created_by", "is_default")
    list_filter = (
        "report_type",
        "is_default",
        "for_admins",
        "for_moderators",
        "for_salesmen",
        "for_customers",
    )
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "template",
        "status",
        "generated_by",
        "created_at",
    )
    list_filter = ("status", "template")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")

    def has_file(self, obj):
        """Check if the report has a file."""
        return bool(obj.file)

    has_file.boolean = True
    has_file.short_description = "Has File"
