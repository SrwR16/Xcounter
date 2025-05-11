import csv
import os
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Count, Sum
from django.utils import timezone

from bookings.models import Booking, Ticket
from movies.models import Movie, Show


class Command(BaseCommand):
    help = "Generates monthly reports for movies, bookings, and revenue"

    def add_arguments(self, parser):
        parser.add_argument(
            "--month",
            type=int,
            default=datetime.now().month,
            help="Month for which to generate reports (1-12)",
        )
        parser.add_argument(
            "--year",
            type=int,
            default=datetime.now().year,
            help="Year for which to generate reports",
        )
        parser.add_argument(
            "--format",
            type=str,
            default="csv",
            choices=["csv", "text"],
            help="Output format for reports",
        )
        parser.add_argument(
            "--output-dir",
            type=str,
            default=None,
            help="Directory to save reports (defaults to reports/ directory)",
        )

    def handle(self, *args, **options):
        month = options["month"]
        year = options["year"]
        output_format = options["format"]
        output_dir = options["output_dir"] or os.path.join(settings.BASE_DIR, "reports")

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Calculate start and end dates for the requested month
        start_date = timezone.make_aware(datetime(year, month, 1))
        if month == 12:
            end_date = timezone.make_aware(datetime(year + 1, 1, 1))
        else:
            end_date = timezone.make_aware(datetime(year, month + 1, 1))

        self.stdout.write(f'Generating reports for {start_date.strftime("%B %Y")}')

        # Generate reports
        self.generate_movie_report(start_date, end_date, output_format, output_dir)
        self.generate_booking_report(start_date, end_date, output_format, output_dir)
        self.generate_revenue_report(start_date, end_date, output_format, output_dir)

        self.stdout.write(
            self.style.SUCCESS(f"Reports generated successfully in {output_dir}")
        )

    def generate_movie_report(self, start_date, end_date, output_format, output_dir):
        """Generate report on movie performance"""
        self.stdout.write("Generating movie performance report...")

        # Get shows in date range
        shows = Show.objects.filter(start_time__gte=start_date, start_time__lt=end_date)

        # Aggregate data by movie
        movie_stats = (
            shows.values("movie")
            .annotate(
                show_count=Count("id"),
                tickets_sold=Count("booking__ticket"),
                revenue=Sum("booking__total_price"),
            )
            .order_by("-tickets_sold")
        )

        # Enrich with movie details
        report_data = []
        for stat in movie_stats:
            try:
                movie = Movie.objects.get(id=stat["movie"])
                report_data.append(
                    {
                        "movie_id": movie.id,
                        "title": movie.title,
                        "genre": movie.genre,
                        "show_count": stat["show_count"] or 0,
                        "tickets_sold": stat["tickets_sold"] or 0,
                        "revenue": stat["revenue"] or 0,
                    }
                )
            except Movie.DoesNotExist:
                continue

        # Output the report
        filename = f'movie_report_{start_date.strftime("%Y_%m")}.{output_format}'
        filepath = os.path.join(output_dir, filename)

        if output_format == "csv":
            with open(filepath, "w", newline="") as csvfile:
                fieldnames = [
                    "movie_id",
                    "title",
                    "genre",
                    "show_count",
                    "tickets_sold",
                    "revenue",
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in report_data:
                    writer.writerow(row)
        else:  # text format
            with open(filepath, "w") as f:
                f.write(f'Movie Performance Report - {start_date.strftime("%B %Y")}\n')
                f.write("=" * 80 + "\n\n")

                if not report_data:
                    f.write("No movie data available for this period.\n")
                else:
                    f.write(
                        f'{"ID":<5} {"Title":<30} {"Genre":<15} {"Shows":<8} {"Tickets":<10} {"Revenue":<10}\n'
                    )
                    f.write("-" * 80 + "\n")

                    for row in report_data:
                        f.write(
                            f'{row["movie_id"]:<5} {row["title"][:30]:<30} {row["genre"][:15]:<15} '
                            f'{row["show_count"]:<8} {row["tickets_sold"]:<10} ${row["revenue"]:<10.2f}\n'
                        )

        self.stdout.write(self.style.SUCCESS(f"Movie report saved to {filepath}"))

    def generate_booking_report(self, start_date, end_date, output_format, output_dir):
        """Generate report on bookings"""
        self.stdout.write("Generating booking report...")

        # Get bookings in date range
        bookings = Booking.objects.filter(
            created_at__gte=start_date, created_at__lt=end_date
        )

        # Summary statistics
        total_bookings = bookings.count()
        total_tickets = Ticket.objects.filter(booking__in=bookings).count()
        total_revenue = bookings.aggregate(Sum("total_price"))["total_price__sum"] or 0

        # Bookings by day
        daily_bookings = (
            bookings.extra({"day": "date(created_at)"})
            .values("day")
            .annotate(count=Count("id"), revenue=Sum("total_price"))
            .order_by("day")
        )

        # Output the report
        filename = f'booking_report_{start_date.strftime("%Y_%m")}.{output_format}'
        filepath = os.path.join(output_dir, filename)

        if output_format == "csv":
            with open(filepath, "w", newline="") as csvfile:
                fieldnames = ["date", "booking_count", "tickets", "revenue"]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for day in daily_bookings:
                    writer.writerow(
                        {
                            "date": day["day"],
                            "booking_count": day["count"],
                            "tickets": Ticket.objects.filter(
                                booking__in=bookings.filter(created_at__date=day["day"])
                            ).count(),
                            "revenue": day["revenue"] or 0,
                        }
                    )
        else:  # text format
            with open(filepath, "w") as f:
                f.write(f'Booking Report - {start_date.strftime("%B %Y")}\n')
                f.write("=" * 80 + "\n\n")

                f.write(f"Total Bookings: {total_bookings}\n")
                f.write(f"Total Tickets: {total_tickets}\n")
                f.write(f"Total Revenue: ${total_revenue:.2f}\n\n")

                f.write("Daily Breakdown:\n")
                f.write(
                    f'{"Date":<12} {"Bookings":<10} {"Tickets":<10} {"Revenue":<10}\n'
                )
                f.write("-" * 80 + "\n")

                for day in daily_bookings:
                    ticket_count = Ticket.objects.filter(
                        booking__in=bookings.filter(created_at__date=day["day"])
                    ).count()
                    f.write(
                        f'{day["day"]:<12} {day["count"]:<10} {ticket_count:<10} ${day["revenue"] or 0:<10.2f}\n'
                    )

        self.stdout.write(self.style.SUCCESS(f"Booking report saved to {filepath}"))

    def generate_revenue_report(self, start_date, end_date, output_format, output_dir):
        """Generate comprehensive revenue report"""
        self.stdout.write("Generating revenue report...")

        # Get bookings in date range
        bookings = Booking.objects.filter(
            created_at__gte=start_date, created_at__lt=end_date
        )

        # Calculate revenue statistics
        total_revenue = bookings.aggregate(Sum("total_price"))["total_price__sum"] or 0
        ticket_revenue = bookings.aggregate(Sum("subtotal"))["subtotal__sum"] or 0
        discount_amount = bookings.aggregate(Sum("discount"))["discount__sum"] or 0

        # Tickets by type
        ticket_types = {}
        for ticket in Ticket.objects.filter(booking__in=bookings).select_related(
            "ticket_type"
        ):
            ticket_type_name = (
                ticket.ticket_type.name if ticket.ticket_type else "Unknown"
            )
            if ticket_type_name not in ticket_types:
                ticket_types[ticket_type_name] = {"count": 0, "revenue": 0}
            ticket_types[ticket_type_name]["count"] += 1
            ticket_types[ticket_type_name]["revenue"] += ticket.price

        # Revenue by payment method
        payment_methods = {}
        for booking in bookings:
            method = booking.payment_method or "Unknown"
            if method not in payment_methods:
                payment_methods[method] = {"count": 0, "revenue": 0}
            payment_methods[method]["count"] += 1
            payment_methods[method]["revenue"] += booking.total_price

        # Output the report
        filename = f'revenue_report_{start_date.strftime("%Y_%m")}.{output_format}'
        filepath = os.path.join(output_dir, filename)

        if output_format == "csv":
            with open(filepath, "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(
                    ["Revenue Summary Report", start_date.strftime("%B %Y")]
                )
                writer.writerow([])

                writer.writerow(["Total Revenue", f"${total_revenue:.2f}"])
                writer.writerow(["Ticket Revenue", f"${ticket_revenue:.2f}"])
                writer.writerow(["Discount Amount", f"${discount_amount:.2f}"])
                writer.writerow([])

                writer.writerow(["Ticket Type Breakdown"])
                writer.writerow(["Ticket Type", "Count", "Revenue"])
                for ticket_type, data in ticket_types.items():
                    writer.writerow(
                        [ticket_type, data["count"], f'${data["revenue"]:.2f}']
                    )
                writer.writerow([])

                writer.writerow(["Payment Method Breakdown"])
                writer.writerow(["Payment Method", "Count", "Revenue"])
                for method, data in payment_methods.items():
                    writer.writerow([method, data["count"], f'${data["revenue"]:.2f}'])
        else:  # text format
            with open(filepath, "w") as f:
                f.write(f'Revenue Report - {start_date.strftime("%B %Y")}\n')
                f.write("=" * 80 + "\n\n")

                f.write(f"Total Revenue: ${total_revenue:.2f}\n")
                f.write(f"Ticket Revenue: ${ticket_revenue:.2f}\n")
                f.write(f"Discount Amount: ${discount_amount:.2f}\n\n")

                f.write("Ticket Type Breakdown:\n")
                f.write(f'{"Ticket Type":<20} {"Count":<10} {"Revenue":<10}\n')
                f.write("-" * 50 + "\n")
                for ticket_type, data in ticket_types.items():
                    f.write(
                        f'{ticket_type[:20]:<20} {data["count"]:<10} ${data["revenue"]:<10.2f}\n'
                    )
                f.write("\n")

                f.write("Payment Method Breakdown:\n")
                f.write(f'{"Payment Method":<20} {"Count":<10} {"Revenue":<10}\n')
                f.write("-" * 50 + "\n")
                for method, data in payment_methods.items():
                    f.write(
                        f'{method[:20]:<20} {data["count"]:<10} ${data["revenue"]:<10.2f}\n'
                    )

        self.stdout.write(self.style.SUCCESS(f"Revenue report saved to {filepath}"))
