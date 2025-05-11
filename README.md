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
