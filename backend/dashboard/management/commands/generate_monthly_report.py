import csv
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

from bookings.models import Booking, Ticket
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Sum
from django.utils import timezone
from movies.models import Movie, Show

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to generate monthly reports.
    This command generates comprehensive reports on movies, bookings, and revenue.
    """

    help = "Generates comprehensive reports on movies, bookings, and revenue"

    def add_arguments(self, parser):
        parser.add_argument(
            "--month",
            type=int,
            help="Month for which to generate reports (1-12)",
            required=False,
        )
        parser.add_argument(
            "--year",
            type=int,
            help="Year for which to generate reports",
            required=False,
        )
        parser.add_argument(
            "--format",
            type=str,
            choices=["csv", "text"],
            default="csv",
            help="Output format for reports (csv or text)",
        )
        parser.add_argument(
            "--output-dir",
            type=str,
            default="reports",
            help="Directory to save reports (defaults to reports/ directory)",
        )
        parser.add_argument(
            "--include-charts",
            action="store_true",
            help="Include chart visualizations in HTML format",
        )

    def handle(self, *args, **options):
        # Get options
        month = options.get("month")
        year = options.get("year")
        output_format = options.get("format", "csv")
        output_dir = options.get("output_dir", "reports")
        include_charts = options.get("include_charts", False)

        # Set default month and year if not provided
        current_time = timezone.now()
        if month is None:
            # Default to previous month
            if current_time.month == 1:
                month = 12
                year = current_time.year - 1 if year is None else year
            else:
                month = current_time.month - 1
                year = current_time.year if year is None else year
        elif year is None:
            year = current_time.year

        # Validate month
        if month < 1 or month > 12:
            raise CommandError("Month must be between 1 and 12")

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Set date range for the report
        start_date = timezone.make_aware(datetime(year, month, 1))
        if month == 12:
            end_date = timezone.make_aware(datetime(year + 1, 1, 1))
        else:
            end_date = timezone.make_aware(datetime(year, month + 1, 1))
        end_date = end_date - timedelta(seconds=1)  # Last second of the month

        # Report header
        month_name = start_date.strftime("%B")
        report_title = f"Monthly Report for {month_name} {year}"
        self.stdout.write(self.style.SUCCESS(f"Generating {report_title}"))

        # Generate reports
        self.generate_movie_report(start_date, end_date, output_dir, output_format)
        self.generate_booking_report(start_date, end_date, output_dir, output_format)
        self.generate_revenue_report(start_date, end_date, output_dir, output_format)

        if include_charts:
            self.generate_chart_visualizations(start_date, end_date, output_dir)

        self.stdout.write(self.style.SUCCESS(f"Reports saved to {output_dir}/"))

    def generate_movie_report(self, start_date, end_date, output_dir, output_format):
        """Generate a report on movie performance."""
        self.stdout.write("Generating movie performance report...")

        # Get all movies with shows during this period
        shows_in_period = Show.objects.filter(
            start_time__gte=start_date, start_time__lte=end_date
        )
        movie_ids = shows_in_period.values_list("movie_id", flat=True).distinct()
        movies = Movie.objects.filter(id__in=movie_ids)

        # For each movie, get the number of shows, tickets sold, and revenue
        movie_data = []
        for movie in movies:
            movie_shows = shows_in_period.filter(movie=movie)
            show_count = movie_shows.count()

            # Get tickets for these shows
            tickets = Ticket.objects.filter(booking__show__in=movie_shows)
            ticket_count = tickets.count()

            # Calculate revenue
            revenue = (
                Booking.objects.filter(show__in=movie_shows).aggregate(
                    total=Sum("total_amount")
                )["total"]
                or 0
            )

            # Calculate average occupancy rate
            total_capacity = sum(show.theater.capacity for show in movie_shows)
            occupancy_rate = (
                (ticket_count / total_capacity * 100) if total_capacity > 0 else 0
            )

            movie_data.append(
                {
                    "id": movie.id,
                    "title": movie.title,
                    "genre": movie.genre.name if movie.genre else "Unknown",
                    "show_count": show_count,
                    "ticket_count": ticket_count,
                    "revenue": revenue,
                    "occupancy_rate": occupancy_rate,
                }
            )

        # Sort by revenue (descending)
        movie_data = sorted(movie_data, key=lambda x: x["revenue"], reverse=True)

        # Write the report
        filename = f"{output_dir}/movie_performance_{start_date.strftime('%Y_%m')}.{output_format}"

        if output_format == "csv":
            with open(filename, "w", newline="") as csvfile:
                fieldnames = [
                    "id",
                    "title",
                    "genre",
                    "show_count",
                    "ticket_count",
                    "revenue",
                    "occupancy_rate",
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                for movie in movie_data:
                    writer.writerow(movie)
        else:  # text format
            with open(filename, "w") as f:
                f.write(f"Movie Performance Report ({start_date.strftime('%B %Y')})\n")
                f.write("=" * 50 + "\n\n")

                for movie in movie_data:
                    f.write(f"Movie: {movie['title']} (ID: {movie['id']})\n")
                    f.write(f"Genre: {movie['genre']}\n")
                    f.write(f"Number of Shows: {movie['show_count']}\n")
                    f.write(f"Tickets Sold: {movie['ticket_count']}\n")
                    f.write(f"Revenue: ${movie['revenue']:.2f}\n")
                    f.write(f"Occupancy Rate: {movie['occupancy_rate']:.2f}%\n")
                    f.write("-" * 30 + "\n\n")

        self.stdout.write(self.style.SUCCESS(f"Movie report saved to {filename}"))

    def generate_booking_report(self, start_date, end_date, output_dir, output_format):
        """Generate a report on booking activity."""
        self.stdout.write("Generating booking activity report...")

        # Get all bookings in this period
        bookings = Booking.objects.filter(
            created_at__gte=start_date, created_at__lte=end_date
        )

        # Group bookings by date
        booking_data = {}
        for booking in bookings:
            date_str = booking.created_at.strftime("%Y-%m-%d")
            if date_str not in booking_data:
                booking_data[date_str] = {
                    "date": date_str,
                    "count": 0,
                    "tickets": 0,
                    "revenue": 0,
                    "cancelled": 0,
                }

            booking_data[date_str]["count"] += 1
            booking_data[date_str]["tickets"] += booking.tickets.count()
            booking_data[date_str]["revenue"] += booking.total_amount

            if booking.status == "CANCELLED":
                booking_data[date_str]["cancelled"] += 1

        # Convert to list and sort by date
        booking_data = [v for k, v in booking_data.items()]
        booking_data = sorted(booking_data, key=lambda x: x["date"])

        # Write the report
        filename = f"{output_dir}/booking_activity_{start_date.strftime('%Y_%m')}.{output_format}"

        if output_format == "csv":
            with open(filename, "w", newline="") as csvfile:
                fieldnames = ["date", "count", "tickets", "revenue", "cancelled"]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                for day_data in booking_data:
                    writer.writerow(day_data)
        else:  # text format
            with open(filename, "w") as f:
                f.write(f"Booking Activity Report ({start_date.strftime('%B %Y')})\n")
                f.write("=" * 50 + "\n\n")

                for day_data in booking_data:
                    f.write(f"Date: {day_data['date']}\n")
                    f.write(f"Bookings: {day_data['count']}\n")
                    f.write(f"Tickets Sold: {day_data['tickets']}\n")
                    f.write(f"Revenue: ${day_data['revenue']:.2f}\n")
                    f.write(f"Cancelled Bookings: {day_data['cancelled']}\n")
                    f.write("-" * 30 + "\n\n")

        self.stdout.write(self.style.SUCCESS(f"Booking report saved to {filename}"))

    def generate_revenue_report(self, start_date, end_date, output_dir, output_format):
        """Generate a report on revenue."""
        self.stdout.write("Generating revenue report...")

        # Get all bookings in this period
        bookings = Booking.objects.filter(
            created_at__gte=start_date, created_at__lte=end_date
        )

        # Calculate overall metrics
        total_bookings = bookings.count()
        total_revenue = bookings.aggregate(total=Sum("total_amount"))["total"] or 0
        avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0

        # Group by payment method
        payment_methods = {}
        for booking in bookings:
            payment_method = booking.payment_method or "Unknown"
            if payment_method not in payment_methods:
                payment_methods[payment_method] = {
                    "method": payment_method,
                    "count": 0,
                    "revenue": 0,
                }

            payment_methods[payment_method]["count"] += 1
            payment_methods[payment_method]["revenue"] += booking.total_amount

        payment_data = [v for k, v in payment_methods.items()]
        payment_data = sorted(payment_data, key=lambda x: x["revenue"], reverse=True)

        # Ticket type analysis
        ticket_types = {}
        tickets = Ticket.objects.filter(booking__in=bookings)
        for ticket in tickets:
            ticket_type = ticket.ticket_type
            if ticket_type not in ticket_types:
                ticket_types[ticket_type] = {
                    "type": ticket_type,
                    "count": 0,
                    "revenue": 0,
                }

            ticket_types[ticket_type]["count"] += 1
            ticket_types[ticket_type]["revenue"] += ticket.price

        ticket_data = [v for k, v in ticket_types.items()]
        ticket_data = sorted(ticket_data, key=lambda x: x["revenue"], reverse=True)

        # Write the report
        filename = (
            f"{output_dir}/revenue_{start_date.strftime('%Y_%m')}.{output_format}"
        )

        if output_format == "csv":
            # Main revenue metrics
            with open(filename, "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["Metric", "Value"])
                writer.writerow(["Total Bookings", total_bookings])
                writer.writerow(["Total Revenue", f"${total_revenue:.2f}"])
                writer.writerow(["Average Booking Value", f"${avg_booking_value:.2f}"])
                writer.writerow([])

                # Payment method breakdown
                writer.writerow(["Payment Method Analysis"])
                writer.writerow(["Method", "Count", "Revenue"])
                for method in payment_data:
                    writer.writerow(
                        [method["method"], method["count"], f"${method['revenue']:.2f}"]
                    )

                writer.writerow([])

                # Ticket type breakdown
                writer.writerow(["Ticket Type Analysis"])
                writer.writerow(["Type", "Count", "Revenue"])
                for ticket_type in ticket_data:
                    writer.writerow(
                        [
                            ticket_type["type"],
                            ticket_type["count"],
                            f"${ticket_type['revenue']:.2f}",
                        ]
                    )

        else:  # text format
            with open(filename, "w") as f:
                f.write(f"Revenue Report ({start_date.strftime('%B %Y')})\n")
                f.write("=" * 50 + "\n\n")

                f.write("Overall Metrics:\n")
                f.write(f"Total Bookings: {total_bookings}\n")
                f.write(f"Total Revenue: ${total_revenue:.2f}\n")
                f.write(f"Average Booking Value: ${avg_booking_value:.2f}\n\n")

                f.write("Payment Method Analysis:\n")
                f.write("-" * 30 + "\n")
                for method in payment_data:
                    f.write(f"Method: {method['method']}\n")
                    f.write(f"Count: {method['count']}\n")
                    f.write(f"Revenue: ${method['revenue']:.2f}\n")
                    f.write("-" * 20 + "\n")

                f.write("\nTicket Type Analysis:\n")
                f.write("-" * 30 + "\n")
                for ticket_type in ticket_data:
                    f.write(f"Type: {ticket_type['type']}\n")
                    f.write(f"Count: {ticket_type['count']}\n")
                    f.write(f"Revenue: ${ticket_type['revenue']:.2f}\n")
                    f.write("-" * 20 + "\n")

        self.stdout.write(self.style.SUCCESS(f"Revenue report saved to {filename}"))

    def generate_chart_visualizations(self, start_date, end_date, output_dir):
        """Generate HTML charts for visualization."""
        self.stdout.write("Generating chart visualizations...")

        try:
            from dashboard.visualization import (
                get_bookings_over_time_chart_data,
                get_genre_distribution_chart_data,
                get_monthly_revenue_chart_data,
                get_ticket_types_chart_data,
            )

            # Create HTML file with charts
            filename = (
                f"{output_dir}/visualizations_{start_date.strftime('%Y_%m')}.html"
            )

            with open(filename, "w") as f:
                f.write(f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Report Visualizations for {start_date.strftime('%B %Y')}</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                        h1, h2 {{ color: #333; }}
                        .chart-container {{
                            width: 800px;
                            height: 400px;
                            margin: 30px auto;
                            padding: 20px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            border-radius: 8px;
                        }}
                    </style>
                </head>
                <body>
                    <h1>Report Visualizations for {start_date.strftime('%B %Y')}</h1>

                    <div class="chart-container">
                        <h2>Monthly Revenue</h2>
                        <canvas id="revenueChart"></canvas>
                    </div>

                    <div class="chart-container">
                        <h2>Genre Distribution</h2>
                        <canvas id="genreChart"></canvas>
                    </div>

                    <div class="chart-container">
                        <h2>Ticket Types</h2>
                        <canvas id="ticketTypesChart"></canvas>
                    </div>

                    <div class="chart-container">
                        <h2>Bookings Over Time</h2>
                        <canvas id="bookingsChart"></canvas>
                    </div>

                    <script>
                        // Revenue Chart
                        const revenueData = {json.dumps(get_monthly_revenue_chart_data(months=12))};
                        new Chart(document.getElementById('revenueChart'), {{
                            type: 'bar',
                            data: revenueData,
                            options: {{ responsive: true }}
                        }});

                        // Genre Distribution Chart
                        const genreData = {json.dumps(get_genre_distribution_chart_data())};
                        new Chart(document.getElementById('genreChart'), {{
                            type: 'pie',
                            data: genreData,
                            options: {{ responsive: true }}
                        }});

                        // Ticket Types Chart
                        const ticketData = {json.dumps(get_ticket_types_chart_data())};
                        new Chart(document.getElementById('ticketTypesChart'), {{
                            type: 'doughnut',
                            data: ticketData,
                            options: {{ responsive: true }}
                        }});

                        // Bookings Over Time Chart
                        const bookingsData = {json.dumps(get_bookings_over_time_chart_data(days=30))};
                        new Chart(document.getElementById('bookingsChart'), {{
                            type: 'line',
                            data: bookingsData,
                            options: {{ responsive: true }}
                        }});
                    </script>
                </body>
                </html>
                """)

            self.stdout.write(
                self.style.SUCCESS(f"Chart visualizations saved to {filename}")
            )

        except ImportError as e:
            self.stdout.write(
                self.style.WARNING(f"Could not generate charts: {str(e)}")
            )
        except Exception as e:
            logger.error(f"Error generating charts: {str(e)}")
            self.stdout.write(self.style.ERROR(f"Error generating charts: {str(e)}"))
            # Don't fail the whole command because charts failed
            pass
