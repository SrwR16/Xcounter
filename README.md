# XCounter - Movie Theater Event Booking System

A comprehensive event booking system designed for a movie theater, where users can book tickets online, apply discount coupons, and view various movie details.

## Features

- Role-based access control (Admin, Moderator, Salesman, Customer)
- Movie and show management
- Ticket booking and management
- Coupons and discount system
- Customer promotion system
- PDF generation for tickets and reports
- Email notifications and messaging
- Role-specific dashboards

## Security Features

### Two-Factor Authentication (2FA)

- Email-based verification codes for Admin and Moderator users
- 6-digit verification code with 10-minute expiry
- Required at each login for enhanced security
- Resend option for verification codes

To use 2FA:

1. Log in with your email and password
2. A verification code will be sent to your registered email
3. Enter the code on the verification page
4. If valid, you will be logged in successfully

This provides an additional layer of security for privileged accounts in the system.

## Management Commands

XCounter includes several powerful management commands for system administration:

### Cleanup Expired Shows

Archives or deletes shows older than a specified number of days.

```bash
python manage.py cleanup_expired_shows --days=30
```

Options:

- `--days`: Shows older than this many days will be marked as archived (default: 30)
- `--delete`: Delete expired shows instead of marking them as archived
- `--dry-run`: Perform a dry run without making any changes

### Generate Monthly Reports

Generates comprehensive reports on movies, bookings, and revenue.

```bash
python manage.py generate_monthly_report --month=5 --year=2025 --format=csv
```

Options:

- `--month`: Month for which to generate reports (1-12)
- `--year`: Year for which to generate reports
- `--format`: Output format for reports (csv or text)
- `--output-dir`: Directory to save reports (defaults to reports/ directory)

### Create System Backup

Creates backups of the database and media files.

```bash
python manage.py create_system_backup --backup-dir=/path/to/backups --include-media
```

Options:

- `--backup-dir`: Directory where backups will be stored (defaults to backups/ directory)
- `--include-media`: Include media files in the backup
- `--compress`: Compress the backup files using gzip

### Send Automated Notifications

Sends automated notifications based on various triggers.

```bash
python manage.py send_automated_notifications
```

This command handles various notification scenarios:

- Upcoming show reminders (24 hours before showtime)
- Booking confirmation reminders for pending bookings
- Movie premiere announcements for users with relevant preferences
- Re-engagement emails for inactive users
- System announcement distribution

## Advanced Reporting

The system now includes comprehensive reporting capabilities:

1. Movie performance reports with revenue analysis
2. Booking reports with daily breakdown
3. Revenue reports with payment method and ticket type breakdown

Reports can be generated in CSV or text format and support flexible date ranges.

## Automated Notifications

The notification system has been enhanced with:

1. Multiple notification types for different scenarios:

   - Booking confirmations/cancellations
   - Show reminders
   - Movie premieres
   - System announcements
   - User inactivity alerts
   - Promotion notices
   - Review responses

2. Support for both email and in-app notifications

3. User-configurable notification preferences

4. Automated notification triggers for relevant events

## Setup Instructions

1. Clone the repository:

```
git clone <repository-url>
cd xcounter
```

2. Create a virtual environment and activate it:

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```
pip install -r requirements.txt
```

4. Run migrations:

```
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:

```
python manage.py createsuperuser
```

6. Run the development server:

```
python manage.py runserver
```

## Project Structure

users - For user authentication, profiles, and role-based permissions
movies - For movie and show management
bookings - For ticket booking, cancellations, and history
coupons - For coupon and discount system
dashboard - For role-specific dashboards and reports
notifications - For email notifications and messaging
employees - For salary management and employee tracking
promotions - For customer promotion system

Phase 1: Core User System
Implement the custom user model with roles
Create authentication endpoints (register, login, logout)
Set up email verification
Add role-based permissions
Test: Create users with different roles and verify permissions
Phase 2: Movie Management
Create movie and show models
Set up APIs for listing and managing movies
Implement show scheduling functionality
Test: Add/edit/delete movies and verify proper role access
Phase 3: Booking System
Create ticket booking models and logic
Implement ticket reservation system
Add booking history for customers
Test: Complete booking flow and verify ticket creation

Phase 4: Discount System
Build coupon models and validation logic
Create customer promotion tiers
Implement automatic discount application
Test: Apply coupons to bookings and verify discount calculation
Phase 5: Employee Features
Add salary management system
Implement performance tracking
Create employee assignment functionality
Test: Manage employee data and verify proper access controls
Phase 6: Dashboard & Reports
Create role-specific dashboards with metrics
Implement PDF generation for tickets and reports
Add data visualization components
Test: Generate reports and verify data accuracy
Phase 7: Notification System
Set up email notification system
Add in-app messaging
Create notification preferences
Test: Trigger notifications for various events and verify delivery
