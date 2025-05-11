#!/bin/bash

echo "XCounter System Features Demo"
echo "============================"
echo

echo "1. Management Commands"
echo "---------------------"

echo "Cleaning up expired shows (dry run):"
python manage.py cleanup_expired_shows --days=30 --dry-run

echo
echo "Generating monthly reports:"
mkdir -p reports
python manage.py generate_monthly_report --month=$(date +%m) --year=$(date +%Y) --format=text --output-dir=reports

echo
echo "Creating system backup:"
mkdir -p backups
python manage.py create_system_backup --backup-dir=backups

echo
echo "2. Automated Notifications"
echo "------------------------"

echo "Sending automated notifications (dry run):"
python manage.py send_automated_notifications

echo
echo "Testing notification features with Python script:"
python test_missing_features.py --notifications

echo
echo "3. Testing all features"
echo "---------------------"
echo "To test all features, run: python test_missing_features.py"

echo
echo "Demo completed."