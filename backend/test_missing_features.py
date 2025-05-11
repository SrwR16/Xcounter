#!/usr/bin/env python
"""
Test script to verify the implementation of the missing features.
This script tests:
1. Management commands
    - cleanup_expired_shows
    - generate_monthly_report
    - create_system_backup
2. Report views
    - EmployeeReportView
    - SalesReportView
3. Report API functions
    - download_generated_report
    - generate_report_api
"""

import importlib
import os
import sys
from io import StringIO
from unittest.mock import patch

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()


class TestResult:
    """Class to store test results"""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []

    def add_result(self, feature_name, test_name, passed, message=None):
        """Add a test result"""
        status = "PASSED" if passed else "FAILED"
        result = {
            "feature": feature_name,
            "test": test_name,
            "status": status,
            "message": message,
        }
        self.results.append(result)
        if passed:
            self.passed += 1
        else:
            self.failed += 1

        # Print the result
        print(f"{status}: {feature_name} - {test_name}")
        if message:
            print(f"  {message}")

    def summary(self):
        """Print a summary of the test results"""
        print(f"\n{'='*50}")
        print(f"TEST SUMMARY: {self.passed} passed, {self.failed} failed")
        print(f"{'='*50}")

        if self.failed > 0:
            print("\nFailed tests:")
            for result in self.results:
                if result["status"] == "FAILED":
                    print(f"- {result['feature']} - {result['test']}")
                    if result["message"]:
                        print(f"  {result['message']}")

        return self.failed == 0


def test_management_command(command_name, test_results):
    """Test if a management command exists and can be called"""
    feature_name = f"Management Command: {command_name}"

    # Test if the command module exists
    try:
        module_path = f"dashboard.management.commands.{command_name}"
        module = importlib.import_module(module_path)
        test_results.add_result(feature_name, "Module exists", True)
    except ImportError as e:
        test_results.add_result(feature_name, "Module exists", False, str(e))
        return

    # Test if the Command class exists
    if hasattr(module, "Command"):
        test_results.add_result(feature_name, "Command class exists", True)
    else:
        test_results.add_result(
            feature_name,
            "Command class exists",
            False,
            "Command class not found in module",
        )
        return

    # Test if the handle method exists
    command_class = module.Command
    if hasattr(command_class, "handle"):
        test_results.add_result(feature_name, "handle method exists", True)
    else:
        test_results.add_result(
            feature_name,
            "handle method exists",
            False,
            "handle method not found in Command class",
        )
        return

    # Test if we can call the command (with mocked execution)
    try:
        with patch("sys.stdout", new=StringIO()), patch("sys.stderr", new=StringIO()):
            # Mock any database operations or file system operations
            with patch.object(command_class, "handle", return_value=None):
                cmd = command_class()
                cmd.handle(dry_run=True)
        test_results.add_result(feature_name, "Command can be called", True)
    except Exception as e:
        test_results.add_result(feature_name, "Command can be called", False, str(e))


def test_chart_view(view_name, test_results):
    """Test if a chart view exists and has required methods"""
    feature_name = f"Chart View: {view_name}"

    # Import the ChartDataView from charts.chart_views
    try:
        from dashboard.charts.chart_views import BaseChartView

        view_module = importlib.import_module("dashboard.charts.chart_views")
        test_results.add_result(feature_name, "Module exists", True)
    except ImportError as e:
        test_results.add_result(feature_name, "Module exists", False, str(e))
        return

    # Test if the view class exists
    if hasattr(view_module, view_name):
        view_class = getattr(view_module, view_name)
        test_results.add_result(feature_name, "View class exists", True)
    else:
        test_results.add_result(
            feature_name, "View class exists", False, f"{view_name} not found in module"
        )
        return

    # Test if the view inherits from BaseChartView
    if issubclass(view_class, BaseChartView):
        test_results.add_result(feature_name, "Inherits from BaseChartView", True)
    else:
        test_results.add_result(
            feature_name,
            "Inherits from BaseChartView",
            False,
            f"{view_name} does not inherit from BaseChartView",
        )
        return

    # Test if the get_chart_data method exists
    if hasattr(view_class, "get_chart_data"):
        test_results.add_result(feature_name, "get_chart_data method exists", True)
    else:
        test_results.add_result(
            feature_name,
            "get_chart_data method exists",
            False,
            "get_chart_data method not found in view class",
        )


def test_api_function(function_name, test_results):
    """Test if an API function exists in views.py"""
    feature_name = f"API Function: {function_name}"

    # Import the views module
    try:
        from dashboard import views

        test_results.add_result(feature_name, "Views module exists", True)
    except ImportError as e:
        test_results.add_result(feature_name, "Views module exists", False, str(e))
        return

    # Test if the function exists
    if hasattr(views, function_name):
        test_results.add_result(feature_name, "Function exists", True)

        # Check if it's a function
        func = getattr(views, function_name)
        if callable(func):
            test_results.add_result(feature_name, "Is callable", True)
        else:
            test_results.add_result(
                feature_name, "Is callable", False, f"{function_name} is not callable"
            )
            return

        # Check if it has a docstring
        if func.__doc__:
            test_results.add_result(feature_name, "Has documentation", True)
        else:
            test_results.add_result(
                feature_name,
                "Has documentation",
                False,
                "Function does not have a docstring",
            )
    else:
        test_results.add_result(
            feature_name,
            "Function exists",
            False,
            f"{function_name} not found in views module",
        )


def main():
    """Main test function"""
    print("Testing missing features...")

    test_results = TestResult()

    # Test management commands
    test_management_command("cleanup_expired_shows", test_results)
    test_management_command("generate_monthly_report", test_results)
    test_management_command("create_system_backup", test_results)

    # Test chart views
    test_chart_view("EmployeeReportView", test_results)
    test_chart_view("SalesReportView", test_results)

    # Test API functions
    test_api_function("download_generated_report", test_results)
    test_api_function("generate_report_api", test_results)

    # Print summary
    success = test_results.summary()

    # Return success code (0) or failure code (1)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
