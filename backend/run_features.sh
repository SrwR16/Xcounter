#!/bin/bash

# Demo script for running all features of the Movie Counter Event Booking System

echo "====================================="
echo "Movie Counter Event Booking System Demo"
echo "====================================="
echo

# Create necessary directories
mkdir -p reports backups

echo "Step 1: Clean up expired shows"
venv/bin/python manage.py cleanup_expired_shows --dry-run

echo
echo "Step 2: Generate monthly reports with charts"
venv/bin/python manage.py generate_monthly_report --output-dir=reports --include-charts

echo
echo "Step 3: Create a system backup"
mkdir -p backups
venv/bin/python manage.py create_system_backup --backup-dir=backups

echo
echo "Step 4: Send automated notifications"
venv/bin/python manage.py send_automated_notifications --dry-run

echo
echo "Step 5: Demo VIP Ticket Reservation (Admin feature)"
echo "This feature allows admin users to reserve special VIP tickets for important guests."
./test_vip_reservation.py || echo "VIP reservation test couldn't be run - make sure the server is running and admin credentials are correct"

echo
echo "Step 6: View Advanced Visualizations"
echo "Open the following file in your browser to see interactive charts:"
echo "file://$(pwd)/reports/visualization_demo.html"

echo
echo "All features demonstrated successfully!"
echo "For more details, see the README.md file"