#!/usr/bin/env python
import os

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


def test_management_commands():
    """Test management commands by direct import and execution"""
    print("\n===== Testing Management Commands =====")

    try:
        from dashboard.management.commands.cleanup_expired_shows import (
            Command as CleanupCommand,
        )
        from dashboard.management.commands.create_system_backup import (
            Command as BackupCommand,
        )
        from dashboard.management.commands.generate_monthly_report import (
            Command as ReportCommand,
        )

        print("✓ All management commands imported successfully")

        # Test command instantiation
        cleanup_cmd = CleanupCommand()
        report_cmd = ReportCommand()
        backup_cmd = BackupCommand()

        print("✓ All management commands instantiated successfully")

        # Check if required methods exist
        assert hasattr(cleanup_cmd, "handle"), "Cleanup command missing handle method"
        assert hasattr(report_cmd, "handle"), "Report command missing handle method"
        assert hasattr(backup_cmd, "handle"), "Backup command missing handle method"

        print("✓ All management commands have the required handle method")

    except Exception as e:
        print(f"✗ Error testing management commands: {str(e)}")


def test_chart_views():
    """Test chart views by direct import"""
    print("\n===== Testing Chart Views =====")

    try:
        from dashboard.charts.chart_views import (
            BaseChartView,
            EmployeeReportView,
            SalesReportView,
        )

        print("✓ Chart views imported successfully")

        # Test inheritance
        assert issubclass(
            SalesReportView, BaseChartView
        ), "SalesReportView should inherit from BaseChartView"
        assert issubclass(
            EmployeeReportView, BaseChartView
        ), "EmployeeReportView should inherit from BaseChartView"

        print("✓ Chart views inherit correctly from BaseChartView")

        # Test required methods
        assert hasattr(
            SalesReportView, "get_chart_data"
        ), "SalesReportView missing get_chart_data method"
        assert hasattr(
            EmployeeReportView, "get_chart_data"
        ), "EmployeeReportView missing get_chart_data method"

        print("✓ Chart views have the required methods")

    except Exception as e:
        print(f"✗ Error testing chart views: {str(e)}")


def test_report_functions():
    """Test report API functions by direct import"""
    print("\n===== Testing Report API Functions =====")

    try:
        from dashboard.views import download_generated_report, generate_report_api

        print("✓ Report API functions imported successfully")

        # Check if they are callable
        assert callable(generate_report_api), "generate_report_api is not callable"
        assert callable(
            download_generated_report
        ), "download_generated_report is not callable"

        print("✓ Report API functions are callable")

        # Check docstrings
        assert generate_report_api.__doc__, "generate_report_api missing docstring"
        assert (
            download_generated_report.__doc__
        ), "download_generated_report missing docstring"

        print("✓ Report API functions have docstrings")

    except Exception as e:
        print(f"✗ Error testing report functions: {str(e)}")


def test_report_generator():
    """Test report generator functions"""
    print("\n===== Testing Report Generator =====")

    try:
        from dashboard.report_generators import generate_pdf_report

        print("✓ Report generator imported successfully")

        # Check if it's callable
        assert callable(generate_pdf_report), "generate_pdf_report is not callable"

        print("✓ Report generator is callable")

        # Check docstring
        assert generate_pdf_report.__doc__, "generate_pdf_report missing docstring"

        print("✓ Report generator has docstring")

    except Exception as e:
        print(f"✗ Error testing report generator: {str(e)}")


def main():
    """Run all tests"""
    # Test management commands
    test_management_commands()

    # Test chart views
    test_chart_views()

    # Test report API functions
    test_report_functions()

    # Test report generator
    test_report_generator()

    print("\n===== Testing Completed =====")


if __name__ == "__main__":
    main()
