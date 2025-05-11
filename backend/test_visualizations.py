#!/usr/bin/env python
"""
Test script to demonstrate advanced report visualizations.
"""

import json
import os
import subprocess
import webbrowser
from datetime import datetime

import requests

# Configuration
BASE_URL = "http://localhost:8000"
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
VISUALIZATION_ENDPOINTS = [
    "/dashboard/charts/movie-ratings/",
    "/dashboard/charts/bookings-over-time/",
    "/dashboard/charts/genre-distribution/",
    "/dashboard/charts/ticket-types/",
    "/dashboard/charts/monthly-revenue/",
]
TOKEN = None  # Will be obtained via login


def login():
    """Login and get authentication token."""
    print("Logging in to get authentication token...")
    try:
        # Try to login with admin credentials
        response = requests.post(
            f"{BASE_URL}/users/login/",
            json={"email": "admin@example.com", "password": "admin123"},
        )
        response.raise_for_status()
        return response.json().get("token")
    except requests.exceptions.RequestException as e:
        print(f"Login failed: {e}")
        return None


def generate_reports():
    """Generate reports with visualizations using management command."""
    print("\nGenerating reports with visualizations...")

    # Create reports directory if it doesn't exist
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Run the generate_monthly_report command
    current_month = datetime.now().month
    current_year = datetime.now().year

    try:
        subprocess.run(
            [
                "venv/bin/python",
                "manage.py",
                "generate_monthly_report",
                f"--month={current_month}",
                f"--year={current_year}",
                "--format=csv",
                f"--output-dir={REPORTS_DIR}",
                "--include-charts",
            ],
            check=True,
        )
        print("Reports generated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to generate reports: {e}")


def test_visualization_endpoints():
    """Test the visualization endpoints."""
    if not TOKEN:
        print("Authentication token not available. Skipping API tests.")
        return

    print("\nTesting visualization endpoints...")

    headers = {"Authorization": f"Token {TOKEN}"}

    for endpoint in VISUALIZATION_ENDPOINTS:
        print(f"Testing endpoint: {endpoint}")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            response.raise_for_status()

            # Save the response to a file
            endpoint_name = endpoint.split("/")[-2]
            output_file = os.path.join(REPORTS_DIR, f"api_{endpoint_name}.json")

            with open(output_file, "w") as f:
                json.dump(response.json(), f, indent=2)

            print(f"  - Success! Response saved to {output_file}")
        except requests.exceptions.RequestException as e:
            print(f"  - Failed: {e}")


def create_html_report():
    """Create an HTML report to visualize the chart data."""
    print("\nCreating HTML report with visualizations...")

    # Find all JSON chart files in the reports directory
    chart_files = [
        f
        for f in os.listdir(REPORTS_DIR)
        if f.endswith(".json") and not f.startswith("api_")
    ]

    if not chart_files:
        print("No chart files found in reports directory.")
        return

    # Load all chart data
    charts = {}
    for chart_file in chart_files:
        try:
            with open(os.path.join(REPORTS_DIR, chart_file), "r") as f:
                chart_name = os.path.splitext(chart_file)[0]
                charts[chart_name] = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading {chart_file}: {e}")

    # Create HTML report
    html_file = os.path.join(REPORTS_DIR, "visualization_report.html")

    with open(html_file, "w") as f:
        f.write(
            """<!DOCTYPE html>
<html>
<head>
    <title>Movie Counter Visualizations</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .chart-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        h2 {
            color: #444;
        }
        canvas {
            max-height: 400px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Movie Counter Visualization Report</h1>
        <p>Generated on """
            + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            + """</p>
"""
        )

        # Add chart sections
        for chart_name, chart_data in charts.items():
            chart_id = chart_name.replace(" ", "_").lower()
            title = " ".join(word.capitalize() for word in chart_name.split("_"))

            f.write(f"""
        <div class="chart-container">
            <h2>{title}</h2>
            <div>
                <canvas id="{chart_id}"></canvas>
            </div>
        </div>
""")

        # Add JavaScript to render charts
        f.write("""
        <script>
""")

        for chart_name, chart_data in charts.items():
            chart_id = chart_name.replace(" ", "_").lower()
            f.write(f"""
            // Initialize {chart_name} chart
            (function() {{
                const ctx = document.getElementById('{chart_id}').getContext('2d');
                const chartData = {json.dumps(chart_data)};

                // Create Chart.js instance
                new Chart(ctx, {{
                    type: chartData.type,
                    data: chartData.data,
                    options: chartData.options
                }});
            }})();
""")

        f.write("""
        </script>
    </div>
</body>
</html>
""")

    print(f"HTML report created: {html_file}")

    # Open the HTML report in browser
    try:
        webbrowser.open(f"file://{os.path.abspath(html_file)}")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print(f"Please open {html_file} manually in your browser.")


def main():
    global TOKEN

    print("=" * 80)
    print("Movie Counter Advanced Visualization Demo")
    print("=" * 80)

    # Get authentication token
    TOKEN = login()

    # Generate reports with visualizations
    generate_reports()

    # Test visualization endpoints
    test_visualization_endpoints()

    # Create HTML report
    create_html_report()

    print("\nDemo completed!")


if __name__ == "__main__":
    main()
