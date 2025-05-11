import logging
import os
from datetime import datetime, timedelta

from bookings.models import Booking, Ticket
from django.conf import settings
from django.db.models import Avg, Sum
from django.utils import timezone
from employees.models import EmployeeProfile, PerformanceReview, SalaryHistory
from movies.models import Movie, Show
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)


def generate_report_pdf(report):
    """
    Generate a PDF report based on the report template and parameters.

    Args:
        report: GeneratedReport instance to generate

    Returns:
        True if successful, False otherwise
    """
    try:
        # Get the report template and parameters
        template = report.template
        parameters = report.parameters or {}

        # Determine the output file path
        upload_dir = os.path.join(settings.MEDIA_ROOT, "reports")
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"report_{report.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        filepath = os.path.join(upload_dir, filename)

        # Generate PDF based on report type
        if template.report_type == "SALES":
            _generate_sales_report(filepath, parameters)
        elif template.report_type == "EMPLOYEE":
            _generate_employee_report(filepath, parameters)
        elif template.report_type == "MOVIES":
            _generate_movies_report(filepath, parameters)
        elif template.report_type == "FINANCE":
            _generate_finance_report(filepath, parameters)
        elif template.report_type == "PERFORMANCE":
            _generate_performance_report(filepath, parameters)
        elif template.report_type == "CUSTOM":
            # Use the template data to generate a custom report
            template_data = template.template_data or {}
            _generate_custom_report(filepath, template_data, parameters)
        else:
            raise ValueError(f"Unknown report type: {template.report_type}")

        # Update the report with the generated file
        report.file = os.path.join("reports", filename)
        report.status = "COMPLETED"
        report.save()

        return True

    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        report.status = "FAILED"
        report.error_message = str(e)
        report.save()
        return False


def _generate_sales_report(filepath, parameters):
    """Generate a sales report PDF."""
    # Get date range parameters
    start_date_str = parameters.get("start_date")
    end_date_str = parameters.get("end_date")

    if start_date_str:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").replace(
            tzinfo=timezone.get_current_timezone()
        )
    else:
        # Default to last 30 days
        start_date = timezone.now() - timedelta(days=30)

    if end_date_str:
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(
            tzinfo=timezone.get_current_timezone()
        )
    else:
        end_date = timezone.now()

    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    elements.append(Paragraph("Sales Report", title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Date range
    date_range_text = (
        f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
    )
    elements.append(Paragraph(date_range_text, normal_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Summary stats
    bookings = Booking.objects.filter(
        created_at__gte=start_date, created_at__lte=end_date
    )

    total_bookings = bookings.count()
    total_tickets = Ticket.objects.filter(booking__in=bookings).count()
    total_revenue = bookings.aggregate(total=Sum("total_amount"))["total"] or 0
    avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0

    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Bookings", str(total_bookings)],
        ["Total Tickets Sold", str(total_tickets)],
        ["Total Revenue", f"${total_revenue:.2f}"],
        ["Average Booking Value", f"${avg_booking_value:.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(Paragraph("Sales Summary", heading_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.25 * inch))

    # Sales by date
    elements.append(Paragraph("Daily Sales", heading_style))
    elements.append(Spacer(1, 0.15 * inch))

    # Group bookings by date
    daily_sales = {}
    for booking in bookings:
        date_str = booking.created_at.strftime("%Y-%m-%d")
        if date_str not in daily_sales:
            daily_sales[date_str] = {"count": 0, "revenue": 0}

        daily_sales[date_str]["count"] += 1
        daily_sales[date_str]["revenue"] += booking.total_amount

    # Sort by date
    sorted_dates = sorted(daily_sales.keys())

    # Create daily sales table
    if sorted_dates:
        daily_data = [["Date", "Bookings", "Revenue"]]
        for date_str in sorted_dates:
            daily_data.append(
                [
                    date_str,
                    str(daily_sales[date_str]["count"]),
                    f"${daily_sales[date_str]['revenue']:.2f}",
                ]
            )

        daily_table = Table(daily_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
        daily_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(daily_table)
    else:
        elements.append(
            Paragraph("No sales data for the selected period.", normal_style)
        )

    # Build the PDF
    doc.build(elements)


def _generate_employee_report(filepath, parameters):
    """Generate an employee report PDF."""
    # Get parameters
    department_id = parameters.get("department_id")

    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    elements.append(Paragraph("Employee Report", title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Filter employees by department if specified
    employees = EmployeeProfile.objects.all()

    if department_id:
        from employees.models import Department

        try:
            department = Department.objects.get(id=department_id)
            employees = employees.filter(position__department=department)
            elements.append(Paragraph(f"Department: {department.name}", normal_style))
        except Department.DoesNotExist:
            pass

    elements.append(Spacer(1, 0.25 * inch))

    # Summary stats
    total_employees = employees.count()
    avg_salary = employees.aggregate(avg=Avg("current_salary"))["avg"] or 0

    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Employees", str(total_employees)],
        ["Average Salary", f"${avg_salary:.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(Paragraph("Employee Summary", heading_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.25 * inch))

    # Employee list
    elements.append(Paragraph("Employee Details", heading_style))
    elements.append(Spacer(1, 0.15 * inch))

    # Create employee table
    if employees.exists():
        employee_data = [["Name", "Position", "Department", "Hire Date", "Salary"]]

        for employee in employees:
            employee_data.append(
                [
                    employee.full_name,
                    employee.position.title if employee.position else "N/A",
                    employee.position.department.name
                    if employee.position and employee.position.department
                    else "N/A",
                    employee.hire_date.strftime("%Y-%m-%d")
                    if employee.hire_date
                    else "N/A",
                    f"${employee.current_salary:.2f}"
                    if employee.current_salary
                    else "N/A",
                ]
            )

        employee_table = Table(
            employee_data,
            colWidths=[1.2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch, 0.8 * inch],
        )
        employee_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(employee_table)
    else:
        elements.append(Paragraph("No employees found.", normal_style))

    # Build the PDF
    doc.build(elements)


def _generate_movies_report(filepath, parameters):
    """Generate a movies and shows report PDF."""
    # Get parameters
    active_only = parameters.get("active_only", True)

    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    elements.append(Paragraph("Movies and Shows Report", title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Filter movies
    movies = Movie.objects.all()
    if active_only:
        movies = movies.filter(is_active=True)
        elements.append(Paragraph("Showing active movies only", normal_style))

    elements.append(Spacer(1, 0.25 * inch))

    # Summary stats
    total_movies = movies.count()
    total_shows = Show.objects.filter(movie__in=movies).count()

    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Movies", str(total_movies)],
        ["Total Shows", str(total_shows)],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(Paragraph("Movies Summary", heading_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.25 * inch))

    # Movie list
    elements.append(Paragraph("Movie Details", heading_style))
    elements.append(Spacer(1, 0.15 * inch))

    # Create movie table
    if movies.exists():
        movie_data = [["Title", "Duration", "Release Date", "Active", "Rating"]]

        for movie in movies:
            movie_data.append(
                [
                    movie.title,
                    f"{movie.duration_minutes} min",
                    movie.release_date.strftime("%Y-%m-%d")
                    if movie.release_date
                    else "N/A",
                    "Yes" if movie.is_active else "No",
                    movie.rating or "N/A",
                ]
            )

        movie_table = Table(
            movie_data,
            colWidths=[2 * inch, 1 * inch, 1.2 * inch, 0.8 * inch, 0.8 * inch],
        )
        movie_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(movie_table)
    else:
        elements.append(Paragraph("No movies found.", normal_style))

    # Build the PDF
    doc.build(elements)


def _generate_finance_report(filepath, parameters):
    """Generate a financial report PDF."""
    # Get date range parameters
    start_date_str = parameters.get("start_date")
    end_date_str = parameters.get("end_date")

    if start_date_str:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").replace(
            tzinfo=timezone.get_current_timezone()
        )
    else:
        # Default to last month
        today = timezone.now().date()
        start_date = datetime(
            today.year, today.month, 1, tzinfo=timezone.get_current_timezone()
        )
        if today.month == 1:
            start_date = datetime(
                today.year - 1, 12, 1, tzinfo=timezone.get_current_timezone()
            )
        else:
            start_date = datetime(
                today.year, today.month - 1, 1, tzinfo=timezone.get_current_timezone()
            )

    if end_date_str:
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(
            tzinfo=timezone.get_current_timezone()
        )
    else:
        # Default to end of last month
        today = timezone.now().date()
        end_date = datetime(
            today.year, today.month, 1, tzinfo=timezone.get_current_timezone()
        )
        end_date = end_date - timedelta(days=1)

    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    elements.append(Paragraph("Financial Report", title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Date range
    date_range_text = (
        f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
    )
    elements.append(Paragraph(date_range_text, normal_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Revenue data
    bookings = Booking.objects.filter(
        created_at__gte=start_date, created_at__lte=end_date
    )

    total_revenue = bookings.aggregate(total=Sum("total_amount"))["total"] or 0

    # Employee salary expenses for the period
    salary_payments = SalaryHistory.objects.filter(
        effective_date__gte=start_date, effective_date__lte=end_date
    )
    total_salary_expense = salary_payments.aggregate(total=Sum("amount"))["total"] or 0

    # Other expenses could be added here

    net_income = total_revenue - total_salary_expense

    # Financial summary table
    summary_data = [
        ["Category", "Amount"],
        ["Total Revenue", f"${total_revenue:.2f}"],
        ["Total Salary Expense", f"${total_salary_expense:.2f}"],
        ["Net Income", f"${net_income:.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(Paragraph("Financial Summary", heading_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.25 * inch))

    # Revenue by source
    elements.append(Paragraph("Revenue Breakdown", heading_style))
    elements.append(Spacer(1, 0.15 * inch))

    # For simplicity, we'll just show ticket sales vs concessions
    # In a real system, you might have more revenue categories
    ticket_revenue = (
        Ticket.objects.filter(booking__in=bookings).aggregate(total=Sum("price"))[
            "total"
        ]
        or 0
    )

    other_revenue = total_revenue - ticket_revenue

    revenue_data = [
        ["Revenue Source", "Amount", "Percentage"],
        [
            "Ticket Sales",
            f"${ticket_revenue:.2f}",
            f"{(ticket_revenue/total_revenue*100):.1f}%" if total_revenue > 0 else "0%",
        ],
        [
            "Other Revenue",
            f"${other_revenue:.2f}",
            f"{(other_revenue/total_revenue*100):.1f}%" if total_revenue > 0 else "0%",
        ],
        ["Total", f"${total_revenue:.2f}", "100%"],
    ]

    revenue_table = Table(revenue_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
    revenue_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(revenue_table)

    # Build the PDF
    doc.build(elements)


def _generate_performance_report(filepath, parameters):
    """Generate a performance review report PDF."""
    # Get parameters
    employee_id = parameters.get("employee_id")
    department_id = parameters.get("department_id")

    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    elements.append(Paragraph("Performance Review Report", title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Filter performance reviews
    reviews = PerformanceReview.objects.all()

    if employee_id:
        try:
            employee = EmployeeProfile.objects.get(id=employee_id)
            reviews = reviews.filter(employee=employee)
            elements.append(Paragraph(f"Employee: {employee.full_name}", normal_style))
        except EmployeeProfile.DoesNotExist:
            pass

    if department_id:
        from employees.models import Department

        try:
            department = Department.objects.get(id=department_id)
            reviews = reviews.filter(employee__position__department=department)
            elements.append(Paragraph(f"Department: {department.name}", normal_style))
        except Department.DoesNotExist:
            pass

    elements.append(Spacer(1, 0.25 * inch))

    # Summary stats
    total_reviews = reviews.count()
    avg_rating = reviews.aggregate(avg=Avg("overall_rating"))["avg"] or 0

    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Reviews", str(total_reviews)],
        ["Average Rating", f"{avg_rating:.1f} / 5.0"],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(Paragraph("Performance Summary", heading_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.25 * inch))

    # Review list
    elements.append(Paragraph("Review Details", heading_style))
    elements.append(Spacer(1, 0.15 * inch))

    # Create review table
    if reviews.exists():
        review_data = [["Employee", "Review Date", "Overall Rating", "Reviewer"]]

        for review in reviews:
            review_data.append(
                [
                    review.employee.full_name,
                    review.review_date.strftime("%Y-%m-%d"),
                    f"{review.overall_rating:.1f}",
                    review.reviewer.full_name if review.reviewer else "N/A",
                ]
            )

        review_table = Table(
            review_data, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 1.5 * inch]
        )
        review_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(review_table)
    else:
        elements.append(Paragraph("No performance reviews found.", normal_style))

    # Build the PDF
    doc.build(elements)


def _generate_custom_report(filepath, template_data, parameters):
    """Generate a custom report PDF based on template data."""
    # Create the PDF document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Build the document
    elements = []

    # Title
    title = template_data.get("title", "Custom Report")
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Date generated
    date_text = f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    elements.append(Paragraph(date_text, normal_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Sections
    sections = template_data.get("sections", [])
    for section in sections:
        section_title = section.get("title", "Section")
        elements.append(Paragraph(section_title, heading_style))
        elements.append(Spacer(1, 0.15 * inch))

        section_content = section.get("content", "")
        elements.append(Paragraph(section_content, normal_style))
        elements.append(Spacer(1, 0.25 * inch))

        # Add table if present
        table_data = section.get("table")
        if table_data and isinstance(table_data, list) and len(table_data) > 0:
            table = Table(table_data)
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                        ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ]
                )
            )
            elements.append(table)
            elements.append(Spacer(1, 0.25 * inch))

    # Build the PDF
    doc.build(elements)


def generate_pdf_report(report_data, output_path):
    """
    Generate a PDF report based on the report data.

    Args:
        report_data: Dictionary containing report configuration
            {
                'title': 'Report Title',
                'type': 'sales|movies|employees',
                'start_date': '2023-01-01',  # Optional
                'end_date': '2023-12-31',    # Optional
                'include_charts': True,      # Optional
                'sections': ['summary', 'details', etc.], # Optional
                'user': 'username',           # Optional
                'generated_at': '2023-05-15T12:34:56',  # Optional
            }
        output_path: Path where to save the PDF file

    Returns:
        True if successful, False otherwise
    """
    try:
        report_type = report_data.get("type", "sales").lower()

        # Convert dates if provided
        parameters = {}
        start_date = report_data.get("start_date")
        end_date = report_data.get("end_date")

        if start_date:
            parameters["start_date"] = start_date

        if end_date:
            parameters["end_date"] = end_date

        # Call the appropriate report generation function
        if report_type == "sales":
            _generate_sales_report(output_path, parameters)
        elif report_type == "employees":
            _generate_employee_report(output_path, parameters)
        elif report_type == "movies":
            _generate_movies_report(output_path, parameters)
        else:
            # For custom reports, build a template_data structure
            title = report_data.get("title", f"{report_type.title()} Report")
            sections = report_data.get("sections", ["summary"])

            template_data = {"title": title, "sections": []}

            # Add sections based on the requested sections
            if "summary" in sections:
                template_data["sections"].append(
                    {
                        "title": "Summary",
                        "content": f'This is a {report_type} report generated on {datetime.now().strftime("%Y-%m-%d")}.',
                    }
                )

            if "details" in sections:
                template_data["sections"].append(
                    {
                        "title": "Details",
                        "content": "Detailed information for this report type is not available.",
                    }
                )

            if "recommendations" in sections:
                template_data["sections"].append(
                    {
                        "title": "Recommendations",
                        "content": "Based on the data, we recommend the following actions...",
                    }
                )

            _generate_custom_report(output_path, template_data, parameters)

        return True

    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        return False
