#!/usr/bin/env python
"""
Test script for Employee Management System features.
This script demonstrates:
1. Creating employees with different roles
2. Managing salary information and history
3. Creating and managing performance reviews
4. Assigning tasks and updating progress
5. Managing leave requests
"""

import os
import random
from datetime import date, timedelta
from decimal import Decimal

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xcounter.settings")
django.setup()

# Import models
from django.db.models import Avg, Count

from employees.models import (
    Assignment,
    Department,
    EmployeeProfile,
    Leave,
    PerformanceReview,
    Position,
    SalaryHistory,
)
from users.models import CustomUser, UserProfile


def print_header(title):
    """Print a section header."""
    print("\n" + "=" * 80)
    print(f" {title.upper()} ".center(80, "="))
    print("=" * 80)


def create_employee(email, first_name, last_name, role, position_title):
    """Create a new employee with a profile."""
    print(f"Creating employee: {first_name} {last_name} ({email}) as {role}")

    # Create user
    user = CustomUser.objects.create_user(
        email=email,
        password="password123",  # Simple password for testing
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_email_verified=True,
    )

    # Create or update user profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.full_name = f"{first_name} {last_name}"
    profile.employee_id = f"EMP-{user.id:06d}"
    profile.save()

    # Get position
    try:
        position = Position.objects.get(title=position_title)
    except Position.DoesNotExist:
        print(f"Position {position_title} not found.")
        return None

    # Create employee profile with random salary within position range
    min_salary = float(position.min_salary)
    max_salary = float(position.max_salary)

    # Generate a random salary between min and max, rounded to nearest 1000
    random_salary = round(random.uniform(min_salary, max_salary) / 1000) * 1000

    employee_profile = EmployeeProfile.objects.create(
        user=user,
        position=position,
        hire_date=date.today()
        - timedelta(
            days=random.randint(30, 365 * 3)
        ),  # Random hire date between 30 days and 3 years ago
        current_salary=Decimal(str(random_salary)),
        bank_account=f"BANK-{random.randint(1000000, 9999999)}",
        tax_id=f"TAX-{random.randint(10000, 99999)}",
        emergency_contact_name=f"Emergency Contact for {first_name}",
        emergency_contact_phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        weekly_hours=40 if random.random() > 0.2 else 20,  # 80% chance of full-time
        is_full_time=random.random() > 0.2,  # 80% chance of full-time
    )

    print(
        f"Employee created: {first_name} {last_name}, {position_title} in {position.department.name}"
    )
    print(f"Salary: ${employee_profile.current_salary}")

    return employee_profile


def create_salary_history(employee_profile, admin_user):
    """Create salary history for an employee."""
    previous_salary = employee_profile.current_salary

    # Calculate a 5-10% increase
    increase_percentage = random.uniform(0.05, 0.10)
    new_salary = previous_salary * (1 + Decimal(str(increase_percentage)))
    new_salary = new_salary.quantize(Decimal("0.01"))  # Round to 2 decimal places

    # Create salary history record
    reason_choices = ["PROMOTION", "ANNUAL_REVIEW", "PERFORMANCE", "ADJUSTMENT"]
    salary_history = SalaryHistory.objects.create(
        employee=employee_profile,
        previous_salary=previous_salary,
        new_salary=new_salary,
        effective_date=date.today(),
        reason=random.choice(reason_choices),
        notes=f"Salary increase of {increase_percentage:.1%}",
        approved_by=admin_user,
    )

    # Update employee's current salary
    employee_profile.current_salary = new_salary
    employee_profile.save()

    print(
        f"Salary updated for {employee_profile.user.email}: ${previous_salary} → ${new_salary}"
    )
    print(f"Reason: {salary_history.reason}")

    return salary_history


def create_performance_review(employee_profile, reviewer):
    """Create a performance review for an employee."""
    # Generate random ratings between 2-5 (biased towards better ratings)
    ratings = [
        random.randint(2, 5) for _ in range(4)
    ]  # productivity, quality, communication, teamwork
    leadership_rating = (
        random.randint(2, 5) if random.random() > 0.3 else None
    )  # 70% chance of leadership rating

    # Calculate average for overall rating, rounded to integer
    if leadership_rating:
        ratings.append(leadership_rating)
    overall_rating = round(sum(ratings) / len(ratings))

    # Create the review
    review = PerformanceReview.objects.create(
        employee=employee_profile,
        reviewer=reviewer,
        review_date=date.today(),
        review_period_start=date.today() - timedelta(days=365),
        review_period_end=date.today(),
        productivity_rating=ratings[0],
        quality_rating=ratings[1],
        communication_rating=ratings[2],
        teamwork_rating=ratings[3],
        leadership_rating=leadership_rating,
        overall_rating=overall_rating,
        strengths="Employee demonstrates strong problem-solving skills and dedication to quality work.",
        areas_for_improvement="Could improve on meeting deadlines and communication with team members.",
        goals_for_next_period="Enhance technical skills and take on more leadership responsibilities.",
    )

    print(f"Performance review created for {employee_profile.user.email}")
    print(f"Overall rating: {overall_rating}/5")

    return review


def create_assignment(employee_profile, assigned_by):
    """Create an assignment for an employee."""
    priority_choices = ["LOW", "MEDIUM", "HIGH", "URGENT"]
    status_choices = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]

    # Make weighted selection - more likely to be medium priority and in progress
    priority = random.choices(priority_choices, weights=[0.2, 0.5, 0.2, 0.1])[0]

    status = random.choices(status_choices, weights=[0.3, 0.4, 0.1, 0.2])[0]

    # Generate start and end dates
    start_date = date.today() - timedelta(days=random.randint(0, 30))

    # 80% chance of having an end date
    if random.random() > 0.2:
        end_date = start_date + timedelta(days=random.randint(1, 60))
    else:
        end_date = None

    # Completion percentage based on status
    if status == "COMPLETED":
        completion = 100
    elif status == "NOT_STARTED":
        completion = 0
    else:
        completion = random.randint(1, 99)

    assignment = Assignment.objects.create(
        title=f"Task for {employee_profile.position.title}",
        description=f"This is a {priority.lower()} priority task that needs to be completed "
        f"{'by ' + end_date.strftime('%Y-%m-%d') if end_date else 'as soon as possible'}.",
        employee=employee_profile,
        assigned_by=assigned_by,
        start_date=start_date,
        end_date=end_date,
        priority=priority,
        status=status,
        completion_percentage=completion,
        notes="Initial assignment notes.",
    )

    print(f"Assignment created for {employee_profile.user.email}")
    print(f"Title: {assignment.title}")
    print(f"Status: {status} ({completion}% complete)")
    print(f"Priority: {priority}")

    return assignment


def create_leave_request(employee_profile, admin_user):
    """Create a leave request for an employee."""
    leave_types = ["VACATION", "SICK", "PERSONAL", "UNPAID"]
    status_choices = ["PENDING", "APPROVED", "REJECTED"]

    # Generate random leave dates (start in the next 30 days, duration 1-14 days)
    start_date = date.today() + timedelta(days=random.randint(1, 30))
    duration = random.randint(1, 14)
    end_date = start_date + timedelta(days=duration - 1)

    leave_type = random.choice(leave_types)
    status = random.choices(status_choices, weights=[0.4, 0.5, 0.1])[
        0
    ]  # 40% pending, 50% approved, 10% rejected

    leave = Leave.objects.create(
        employee=employee_profile,
        leave_type=leave_type,
        start_date=start_date,
        end_date=end_date,
        reason=f"Request for {duration} days of {leave_type.lower()} leave",
        status=status,
    )

    # If approved or rejected, set the admin user
    if status in ["APPROVED", "REJECTED"]:
        leave.approved_by = admin_user
        if status == "REJECTED":
            leave.rejected_reason = "Busy period, insufficient staffing"
        leave.save()

    print(f"Leave request created for {employee_profile.user.email}")
    print(f"Type: {leave_type}")
    print(f"Duration: {duration} days ({start_date} to {end_date})")
    print(f"Status: {status}")

    return leave


def get_employee_stats():
    """Calculate and print employee statistics."""
    total_employees = EmployeeProfile.objects.count()

    print(f"Total employees: {total_employees}")

    # Department distribution
    print("\nDepartment Distribution:")
    dept_counts = Department.objects.annotate(
        employee_count=Count("positions__employees")
    )
    for dept in dept_counts:
        print(f"  {dept.name}: {dept.employee_count} employees")

    # Salary statistics
    avg_salary = EmployeeProfile.objects.aggregate(Avg("current_salary"))[
        "current_salary__avg"
    ]
    print(f"\nAverage salary: ${avg_salary:.2f}")

    # Performance statistics
    reviews_count = PerformanceReview.objects.count()
    if reviews_count > 0:
        avg_rating = PerformanceReview.objects.aggregate(Avg("overall_rating"))[
            "overall_rating__avg"
        ]
        print(f"\nPerformance reviews: {reviews_count}")
        print(f"Average rating: {avg_rating:.1f}/5")

    # Leave statistics
    leave_counts = Leave.objects.values("status").annotate(count=Count("id"))
    print("\nLeave Requests:")
    for status in leave_counts:
        print(f"  {status['status']}: {status['count']}")

    # Assignment statistics
    assignment_stats = Assignment.objects.values("status").annotate(count=Count("id"))
    print("\nAssignments:")
    for status in assignment_stats:
        print(f"  {status['status']}: {status['count']}")


def main():
    print_header("Employee Management System Test")

    # Check if admin user exists
    try:
        admin_user = CustomUser.objects.get(email="admin@example.com")
        print("Admin user already exists.")
    except CustomUser.DoesNotExist:
        # Create admin user if not exists
        admin_user = CustomUser.objects.create_superuser(
            email="admin@example.com", password="admin123", role="ADMIN"
        )
        print("Admin user created.")

    # Check if we already have employees (to avoid duplicates on multiple runs)
    existing_count = EmployeeProfile.objects.count()
    if existing_count > 0:
        print(f"Already have {existing_count} employees. Skipping employee creation.")
        employees = list(EmployeeProfile.objects.all()[:5])  # Get a few for testing
    else:
        print_header("Creating Employees")
        # Create some employees with different positions
        employees = []

        # Create department manager for each department
        for dept in Department.objects.all():
            # Get the manager position for this department
            try:
                manager_position = Position.objects.filter(
                    department=dept, title__contains="Manager"
                ).first()

                if manager_position:
                    email = f"{dept.name.lower().replace(' ', '')}@example.com"
                    employee = create_employee(
                        email=email,
                        first_name=f"{dept.name.split()[0]}",
                        last_name="Manager",
                        role="MODERATOR",
                        position_title=manager_position.title,
                    )
                    if employee:
                        employees.append(employee)
            except Exception as e:
                print(f"Error creating manager for {dept.name}: {e}")

        # Create some regular employees
        positions = Position.objects.exclude(title__contains="Manager")
        for i in range(10):
            try:
                position = random.choice(positions)
                employee = create_employee(
                    email=f"employee{i+1}@example.com",
                    first_name=f"Employee{i+1}",
                    last_name="Test",
                    role="SALESMAN",
                    position_title=position.title,
                )
                if employee:
                    employees.append(employee)
            except Exception as e:
                print(f"Error creating employee {i+1}: {e}")

    # Create salary history records
    print_header("Managing Salary History")
    for employee in employees[:3]:  # Update salary for first 3 employees
        create_salary_history(employee, admin_user)

    # Create performance reviews
    print_header("Creating Performance Reviews")
    for employee in employees:
        create_performance_review(employee, admin_user)

    # Create assignments
    print_header("Creating Assignments")
    for employee in employees:
        create_assignment(employee, admin_user)

    # Create leave requests
    print_header("Managing Leave Requests")
    for employee in employees:
        create_leave_request(employee, admin_user)

    # Calculate and print statistics
    print_header("Employee Statistics")
    get_employee_stats()

    print_header("Test Completed")
    print("Employee management features have been tested successfully.")


if __name__ == "__main__":
    main()
