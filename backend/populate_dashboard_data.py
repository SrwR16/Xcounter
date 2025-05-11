import json
import os
import random
from datetime import timedelta

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from django.utils import timezone

from dashboard.models import Metric, MetricValue, ReportTemplate


def create_metrics():
    """Create sample dashboard metrics"""
    print("Creating dashboard metrics...")

    # Sales metrics
    metrics = [
        # Sales metrics
        {
            "name": "Total Sales",
            "description": "Total sales amount across all bookings",
            "category": "SALES",
            "display_type": "CURRENCY",
            "calculation_method": "total_sales",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "display_order": 1,
        },
        {
            "name": "Monthly Sales",
            "description": "Sales amount for the current month",
            "category": "SALES",
            "display_type": "CURRENCY",
            "calculation_method": "monthly_sales",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "display_order": 2,
        },
        {
            "name": "Daily Sales",
            "description": "Sales amount for today",
            "category": "SALES",
            "display_type": "CURRENCY",
            "calculation_method": "daily_sales",
            "refresh_frequency": "HOURLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "display_order": 3,
        },
        {
            "name": "Tickets Sold",
            "description": "Total number of tickets sold",
            "category": "SALES",
            "display_type": "NUMBER",
            "calculation_method": "tickets_sold",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "display_order": 4,
        },
        {
            "name": "Coupon Usage Statistics",
            "description": "Usage statistics for different coupon codes",
            "category": "SALES",
            "display_type": "CHART_BAR",
            "calculation_method": "coupon_usage",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 5,
        },
        # Performance metrics
        {
            "name": "Popular Movies",
            "description": "Most popular movies by ticket sales",
            "category": "PERFORMANCE",
            "display_type": "CHART_BAR",
            "calculation_method": "popular_movies",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": True,
            "display_order": 6,
        },
        {
            "name": "Theater Utilization",
            "description": "Utilization rate of each theater",
            "category": "PERFORMANCE",
            "display_type": "CHART_PIE",
            "calculation_method": "theater_utilization",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 7,
        },
        # Customer metrics
        {
            "name": "Total Customers",
            "description": "Total number of registered customers",
            "category": "CUSTOMER",
            "display_type": "NUMBER",
            "calculation_method": "total_customers",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 8,
        },
        {
            "name": "New Customers",
            "description": "Number of new customers in the last 30 days",
            "category": "CUSTOMER",
            "display_type": "NUMBER",
            "calculation_method": "new_customers",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 9,
        },
        {
            "name": "Customer Retention Rate",
            "description": "Percentage of customers who have made multiple bookings",
            "category": "CUSTOMER",
            "display_type": "PERCENTAGE",
            "calculation_method": "customer_retention",
            "refresh_frequency": "WEEKLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 10,
        },
        # Movie metrics
        {
            "name": "Active Movies",
            "description": "Number of active movies",
            "category": "INVENTORY",
            "display_type": "NUMBER",
            "calculation_method": "active_movies",
            "refresh_frequency": "DAILY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": True,
            "display_order": 11,
        },
        {
            "name": "Upcoming Shows",
            "description": "Number of upcoming shows",
            "category": "INVENTORY",
            "display_type": "NUMBER",
            "calculation_method": "upcoming_shows",
            "refresh_frequency": "HOURLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": True,
            "display_order": 12,
        },
        # Employee metrics
        {
            "name": "Total Employees",
            "description": "Total number of employees",
            "category": "EMPLOYEE",
            "display_type": "NUMBER",
            "calculation_method": "total_employees",
            "refresh_frequency": "WEEKLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 13,
        },
        {
            "name": "Department Distribution",
            "description": "Distribution of employees across departments",
            "category": "EMPLOYEE",
            "display_type": "CHART_PIE",
            "calculation_method": "department_distribution",
            "refresh_frequency": "WEEKLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 14,
        },
        {
            "name": "Average Salary",
            "description": "Average salary of employees",
            "category": "EMPLOYEE",
            "display_type": "CURRENCY",
            "calculation_method": "average_salary",
            "refresh_frequency": "MONTHLY",
            "for_admins": True,
            "for_moderators": False,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 15,
        },
        {
            "name": "Performance Ratings",
            "description": "Average performance review ratings",
            "category": "EMPLOYEE",
            "display_type": "NUMBER",
            "calculation_method": "performance_ratings",
            "refresh_frequency": "MONTHLY",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "display_order": 16,
        },
    ]

    for metric_data in metrics:
        # Check if metric already exists
        try:
            metric = Metric.objects.get(name=metric_data["name"])
            print(f"Metric '{metric_data['name']}' already exists, skipping...")
        except Metric.DoesNotExist:
            metric = Metric.objects.create(**metric_data)
            print(f"Created metric: {metric.name}")

            # Create some sample metric values
            create_sample_metric_values(metric)


def create_sample_metric_values(metric):
    """Create sample values for a metric"""
    now = timezone.now()

    # Create 30 days of historical data
    for i in range(30):
        timestamp = now - timedelta(days=i)

        if metric.display_type in ["NUMBER", "CURRENCY", "PERCENTAGE"]:
            # Generate a random numeric value
            if "sales" in metric.calculation_method:
                value = random.uniform(1000, 5000)
            elif "count" in metric.calculation_method or metric.calculation_method in [
                "tickets_sold",
                "active_movies",
                "upcoming_shows",
                "total_employees",
                "total_customers",
                "new_customers",
            ]:
                value = random.randint(50, 200)
            elif "rating" in metric.calculation_method:
                value = random.uniform(3.0, 5.0)
            elif "salary" in metric.calculation_method:
                value = random.uniform(30000, 70000)
            elif "retention" in metric.calculation_method:
                value = random.uniform(60, 90)
            else:
                value = random.uniform(10, 100)

            MetricValue.objects.create(
                metric=metric, timestamp=timestamp, numeric_value=value
            )

        elif metric.display_type == "TEXT":
            # Generate a sample text value
            texts = [
                "Excellent performance",
                "Good results",
                "Meeting expectations",
                "Needs improvement",
                "Exceeding targets",
            ]
            MetricValue.objects.create(
                metric=metric, timestamp=timestamp, string_value=random.choice(texts)
            )

        elif metric.display_type in ["CHART_LINE", "CHART_BAR", "CHART_PIE"]:
            # Generate sample chart data
            if metric.calculation_method == "coupon_usage":
                data = {
                    "labels": [
                        "WELCOME10",
                        "SUMMER20",
                        "WEEKEND15",
                        "BIRTHDAY25",
                        "SPECIAL50",
                    ],
                    "data": [random.randint(10, 50) for _ in range(5)],
                }
            elif metric.calculation_method == "popular_movies":
                data = {
                    "labels": [
                        "Avengers",
                        "Star Wars",
                        "Jurassic Park",
                        "The Lion King",
                        "Titanic",
                    ],
                    "data": [random.randint(50, 200) for _ in range(5)],
                }
            elif metric.calculation_method == "theater_utilization":
                data = {
                    "labels": [
                        "Theater A",
                        "Theater B",
                        "Theater C",
                        "Theater D",
                        "Theater E",
                    ],
                    "data": [random.uniform(50, 95) for _ in range(5)],
                }
            elif metric.calculation_method == "department_distribution":
                data = {
                    "labels": [
                        "Management",
                        "Sales",
                        "Operations",
                        "Customer Service",
                        "IT",
                    ],
                    "data": [random.randint(5, 20) for _ in range(5)],
                }
            else:
                data = {
                    "labels": [
                        "Category A",
                        "Category B",
                        "Category C",
                        "Category D",
                        "Category E",
                    ],
                    "data": [random.randint(10, 100) for _ in range(5)],
                }

            MetricValue.objects.create(
                metric=metric, timestamp=timestamp, json_value=data
            )


def create_report_templates():
    """Create sample report templates"""
    print("Creating report templates...")

    templates = [
        {
            "name": "Sales Report",
            "description": "Detailed sales report with revenue breakdown",
            "report_type": "SALES",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "is_default": True,
        },
        {
            "name": "Employee Report",
            "description": "Employee details and statistics",
            "report_type": "EMPLOYEE",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "is_default": True,
        },
        {
            "name": "Movies and Shows Report",
            "description": "Active movies and show schedules",
            "report_type": "MOVIES",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": True,
            "for_customers": False,
            "is_default": True,
        },
        {
            "name": "Financial Report",
            "description": "Monthly financial summary with revenue and expenses",
            "report_type": "FINANCE",
            "for_admins": True,
            "for_moderators": False,
            "for_salesmen": False,
            "for_customers": False,
            "is_default": True,
        },
        {
            "name": "Performance Reviews Report",
            "description": "Summary of employee performance reviews",
            "report_type": "PERFORMANCE",
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "is_default": True,
        },
        {
            "name": "Custom Summary Report",
            "description": "Customizable report with key metrics",
            "report_type": "CUSTOM",
            "template_data": json.dumps(
                {
                    "title": "Theater Performance Summary",
                    "sections": [
                        {
                            "type": "text",
                            "title": "Overview",
                            "content": "This report provides a summary of key performance indicators for the theater.",
                        },
                        {
                            "type": "table",
                            "title": "Key Metrics",
                            "headers": [
                                "Metric",
                                "Current Value",
                                "Previous Period",
                                "Change",
                            ],
                            "data": [
                                ["Total Revenue", "$10,000", "$9,500", "+5.3%"],
                                ["Tickets Sold", "500", "480", "+4.2%"],
                                ["Average Occupancy", "72%", "68%", "+5.9%"],
                                [
                                    "Customer Satisfaction",
                                    "4.8/5.0",
                                    "4.7/5.0",
                                    "+2.1%",
                                ],
                            ],
                        },
                        {"page_break": True},
                        {
                            "type": "text",
                            "title": "Recommendations",
                            "content": "Based on the current performance, the following actions are recommended:\n1. Increase marketing for weekday shows\n2. Optimize staff scheduling for peak hours\n3. Introduce new concession items to increase per-customer spending",
                        },
                    ],
                }
            ),
            "for_admins": True,
            "for_moderators": True,
            "for_salesmen": False,
            "for_customers": False,
            "is_default": False,
        },
    ]

    for template_data in templates:
        # Check if template already exists
        try:
            template = ReportTemplate.objects.get(name=template_data["name"])
            print(
                f"Report template '{template_data['name']}' already exists, skipping..."
            )
        except ReportTemplate.DoesNotExist:
            # Get first admin user as creator
            from users.models import CustomUser

            try:
                admin_user = CustomUser.objects.filter(role="ADMIN").first()
                template_data["created_by"] = admin_user
            except:
                pass

            template = ReportTemplate.objects.create(**template_data)
            print(f"Created report template: {template.name}")


if __name__ == "__main__":
    create_metrics()
    create_report_templates()
    print("Dashboard data population complete!")
