from rest_framework import serializers

from .models import (
    DashboardLayout,
    GeneratedReport,
    Metric,
    MetricValue,
    ReportTemplate,
)


class MetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metric
        fields = [
            "id",
            "name",
            "description",
            "category",
            "display_type",
            "is_active",
            "refresh_frequency",
            "display_order",
            "for_admins",
            "for_moderators",
            "for_salesmen",
            "for_customers",
        ]


class MetricDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metric
        fields = "__all__"


class MetricValueSerializer(serializers.ModelSerializer):
    metric_name = serializers.ReadOnlyField(source="metric.name")
    display_type = serializers.ReadOnlyField(source="metric.display_type")
    category = serializers.ReadOnlyField(source="metric.category")

    class Meta:
        model = MetricValue
        fields = [
            "id",
            "metric",
            "metric_name",
            "display_type",
            "category",
            "timestamp",
            "numeric_value",
            "string_value",
            "json_value",
        ]


class DashboardLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardLayout
        fields = ["id", "user", "layout_data", "last_modified"]
        read_only_fields = ["user", "last_modified"]

    def create(self, validated_data):
        # Automatically set the user to the current authenticated user
        user = self.context["request"].user
        validated_data["user"] = user

        # Check if the user already has a dashboard layout
        try:
            layout = DashboardLayout.objects.get(user=user)
            # Update the existing layout
            layout.layout_data = validated_data.get("layout_data", layout.layout_data)
            layout.save()
            return layout
        except DashboardLayout.DoesNotExist:
            # Create a new layout
            return super().create(validated_data)


class ReportTemplateSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source="created_by.email")

    class Meta:
        model = ReportTemplate
        fields = [
            "id",
            "name",
            "description",
            "report_type",
            "template_data",
            "created_by",
            "created_by_email",
            "is_default",
            "created_at",
            "updated_at",
            "for_admins",
            "for_moderators",
            "for_salesmen",
            "for_customers",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        # Automatically set the created_by to the current authenticated user
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ReportGenerationSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    name = serializers.CharField(max_length=200)
    parameters = serializers.JSONField(default=dict)


class GeneratedReportSerializer(serializers.ModelSerializer):
    template_name = serializers.ReadOnlyField(source="template.name")
    generated_by_email = serializers.ReadOnlyField(source="generated_by.email")
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedReport
        fields = [
            "id",
            "template",
            "template_name",
            "name",
            "parameters",
            "file",
            "file_url",
            "file_size",
            "generated_by",
            "generated_by_email",
            "status",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "template_name",
            "file_url",
            "file_size",
            "generated_by_email",
            "status",
            "error_message",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size(self, obj):
        return obj.get_file_size()


class DashboardMetricsSerializer(serializers.Serializer):
    """
    Serializer for the dashboard metrics endpoint which returns
    both metrics and their latest values.
    """

    metrics = MetricSerializer(many=True, read_only=True)
    values = serializers.DictField(child=serializers.DictField())
