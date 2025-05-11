#!/bin/bash

# Demo script for running all features

echo -e "\n===== Movie Counter Feature Demo =====\n"

# Create reports directory if it doesn't exist
mkdir -p reports

# Clean up expired shows
echo -e "\n1. Cleaning up expired shows:"
echo "-------------------------"
venv/bin/python manage.py cleanup_expired_shows --days=30 --dry-run

# Generate monthly report with visualizations
echo -e "\n2. Generating monthly reports with charts:"
echo "-------------------------"
venv/bin/python manage.py generate_monthly_report --include-charts --output-dir=reports

# Create system backup
echo -e "\n3. Creating system backup:"
echo "-------------------------"
mkdir -p backups
venv/bin/python manage.py create_system_backup --backup-dir=backups

# Send automated notifications
echo -e "\n4. Sending automated notifications:"
echo "-------------------------"
venv/bin/python manage.py send_automated_notifications --dry-run

# Check the advanced visualizations
echo -e "\n5. View advanced visualizations:"
echo "-------------------------"
echo "You can view the visualization demo at:"
echo "file://$(pwd)/reports/visualization_demo.html"
echo ""
echo "Try opening this file in your browser to see the interactive charts!"

echo -e "\nAll features successfully demonstrated!"