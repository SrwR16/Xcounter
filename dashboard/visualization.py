"""
Advanced visualization module for creating interactive charts and graphs.
"""

import random
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Avg, Count, Sum
from django.utils import timezone

from bookings.models import Booking, Ticket
from movies.models import Movie
from reviews.models import Review


def random_rgb():
    """Generate a random RGB color."""
    return f"rgb({random.randint(0, 255)}, {random.randint(0, 255)}, {random.randint(0, 255)})"


def random_rgba(opacity=0.7):
    """Generate a random RGBA color with given opacity."""
    return f"rgba({random.randint(0, 255)}, {random.randint(0, 255)}, {random.randint(0, 255)}, {opacity})"


def get_pie_chart_colors(count):
    """Generate a list of background colors and border colors for a pie chart."""
    background_colors = [random_rgba(0.7) for _ in range(count)]
    border_colors = [color.replace(", 0.7)", ", 1)") for color in background_colors]
    return background_colors, border_colors


def get_movie_ratings_chart_data():
    """
    Generate data for a chart showing movie ratings.

    Returns:
        dict: Chart.js formatted data for movie ratings
    """
    cache_key = "movie_ratings_chart_data"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Get top rated movies with at least 3 reviews
    top_movies = (
        Movie.objects.annotate(
            review_count=Count(
                "reviews", filter=Review.objects.filter(is_approved=True)
            ),
            avg_rating=Avg(
                "reviews__rating", filter=Review.objects.filter(is_approved=True)
            ),
        )
        .filter(review_count__gte=3)
        .order_by("-avg_rating")[:10]
    )

    labels = [movie.title for movie in top_movies]
    ratings = [round(movie.avg_rating or 0, 1) for movie in top_movies]
    review_counts = [movie.review_count for movie in top_movies]

    background_colors, border_colors = get_pie_chart_colors(len(labels))

    chart_data = {
        "type": "bar",
        "data": {
            "labels": labels,
            "datasets": [
                {
                    "label": "Average Rating",
                    "data": ratings,
                    "backgroundColor": background_colors,
                    "borderColor": border_colors,
                    "borderWidth": 1,
                }
            ],
        },
        "options": {
            "scales": {"y": {"beginAtZero": True, "max": 5}},
            "plugins": {
                "tooltip": {
                    "callbacks": {
                        "afterLabel": 'function(context) { return "Reviews: " + ['
                        + ",".join(map(str, review_counts))
                        + "][context.dataIndex]; }"
                    }
                }
            },
        },
    }

    # Cache for 1 hour
    cache.set(cache_key, chart_data, 3600)

    return chart_data


def get_bookings_over_time_chart_data(days=30):
    """
    Generate data for a chart showing bookings over time.

    Args:
        days: Number of days to include in the chart

    Returns:
        dict: Chart.js formatted data for bookings over time
    """
    cache_key = f"bookings_over_time_chart_data_{days}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Calculate date range
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days - 1)

    # Generate date labels
    date_labels = []
    current_date = start_date
    while current_date <= end_date:
        date_labels.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)

    # Get bookings by day
    bookings_by_day = (
        Booking.objects.filter(
            created_at__date__gte=start_date, created_at__date__lte=end_date
        )
        .extra({"booking_date": "date(created_at)"})
        .values("booking_date")
        .annotate(count=Count("id"), revenue=Sum("total_price"))
        .order_by("booking_date")
    )

    # Convert to dict for faster lookup
    bookings_dict = {
        item["booking_date"].strftime("%Y-%m-%d"): item for item in bookings_by_day
    }

    # Prepare datasets
    booking_counts = []
    booking_revenues = []

    for date_label in date_labels:
        if date_label in bookings_dict:
            booking_counts.append(bookings_dict[date_label]["count"])
            booking_revenues.append(float(bookings_dict[date_label]["revenue"] or 0))
        else:
            booking_counts.append(0)
            booking_revenues.append(0)

    chart_data = {
        "type": "line",
        "data": {
            "labels": date_labels,
            "datasets": [
                {
                    "label": "Bookings",
                    "data": booking_counts,
                    "backgroundColor": "rgba(54, 162, 235, 0.2)",
                    "borderColor": "rgba(54, 162, 235, 1)",
                    "borderWidth": 1,
                    "yAxisID": "y",
                },
                {
                    "label": "Revenue",
                    "data": booking_revenues,
                    "backgroundColor": "rgba(255, 99, 132, 0.2)",
                    "borderColor": "rgba(255, 99, 132, 1)",
                    "borderWidth": 1,
                    "yAxisID": "y1",
                },
            ],
        },
        "options": {
            "scales": {
                "y": {
                    "type": "linear",
                    "display": True,
                    "position": "left",
                    "title": {"display": True, "text": "Number of Bookings"},
                },
                "y1": {
                    "type": "linear",
                    "display": True,
                    "position": "right",
                    "title": {"display": True, "text": "Revenue"},
                    "grid": {"drawOnChartArea": False},
                },
            }
        },
    }

    # Cache for 1 hour
    cache.set(cache_key, chart_data, 3600)

    return chart_data


def get_genre_distribution_chart_data():
    """
    Generate data for a pie chart showing movie genre distribution.

    Returns:
        dict: Chart.js formatted data for genre distribution
    """
    cache_key = "genre_distribution_chart_data"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Get bookings by genre
    genre_data = (
        Movie.objects.values("genre")
        .annotate(
            movie_count=Count("id", distinct=True),
            booking_count=Count("shows__booking", distinct=True),
            revenue=Sum("shows__booking__total_price"),
        )
        .order_by("-booking_count")
    )

    labels = [item["genre"] or "Unknown" for item in genre_data]
    booking_counts = [item["booking_count"] or 0 for item in genre_data]
    revenues = [float(item["revenue"] or 0) for item in genre_data]

    background_colors, border_colors = get_pie_chart_colors(len(labels))

    chart_data = {
        "type": "pie",
        "data": {
            "labels": labels,
            "datasets": [
                {
                    "label": "Bookings by Genre",
                    "data": booking_counts,
                    "backgroundColor": background_colors,
                    "borderColor": border_colors,
                    "borderWidth": 1,
                }
            ],
        },
        "options": {
            "plugins": {
                "tooltip": {
                    "callbacks": {
                        "afterLabel": 'function(context) { return "Revenue: $" + ['
                        + ",".join(map(str, revenues))
                        + "][context.dataIndex].toFixed(2); }"
                    }
                }
            }
        },
    }

    # Cache for 1 hour
    cache.set(cache_key, chart_data, 3600)

    return chart_data


def get_ticket_types_chart_data():
    """
    Generate data for a chart showing ticket type distribution.

    Returns:
        dict: Chart.js formatted data for ticket types
    """
    cache_key = "ticket_types_chart_data"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Get tickets by type
    ticket_data = (
        Ticket.objects.values("seat_category")
        .annotate(count=Count("id"), revenue=Sum("price"))
        .order_by("-count")
    )

    labels = [item["seat_category"] for item in ticket_data]
    ticket_counts = [item["count"] for item in ticket_data]
    revenues = [float(item["revenue"] or 0) for item in ticket_data]

    background_colors, border_colors = get_pie_chart_colors(len(labels))

    chart_data = {
        "type": "doughnut",
        "data": {
            "labels": labels,
            "datasets": [
                {
                    "label": "Tickets by Type",
                    "data": ticket_counts,
                    "backgroundColor": background_colors,
                    "borderColor": border_colors,
                    "borderWidth": 1,
                }
            ],
        },
        "options": {
            "plugins": {
                "tooltip": {
                    "callbacks": {
                        "afterLabel": 'function(context) { return "Revenue: $" + ['
                        + ",".join(map(str, revenues))
                        + "][context.dataIndex].toFixed(2); }"
                    }
                }
            }
        },
    }

    # Cache for 1 hour
    cache.set(cache_key, chart_data, 3600)

    return chart_data


def get_monthly_revenue_chart_data(months=12):
    """
    Generate data for a chart showing monthly revenue.

    Args:
        months: Number of months to include in the chart

    Returns:
        dict: Chart.js formatted data for monthly revenue
    """
    cache_key = f"monthly_revenue_chart_data_{months}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Calculate date range
    end_date = timezone.now().date().replace(day=1)
    start_date = (end_date - timedelta(days=1)).replace(day=1)
    for _ in range(months - 1):
        start_date = (start_date - timedelta(days=1)).replace(day=1)

    # Generate month labels
    month_labels = []
    current_date = start_date
    while current_date <= end_date:
        month_labels.append(current_date.strftime("%Y-%m"))
        next_month = current_date.month + 1
        next_year = current_date.year
        if next_month > 12:
            next_month = 1
            next_year += 1
        current_date = current_date.replace(year=next_year, month=next_month)

    # Get revenue by month
    bookings_by_month = (
        Booking.objects.filter(created_at__date__gte=start_date)
        .extra({"month": "strftime('%%Y-%%m', created_at)"})
        .values("month")
        .annotate(
            count=Count("id"),
            gross_revenue=Sum("total_price"),
            net_revenue=Sum("subtotal"),
        )
        .order_by("month")
    )

    # Convert to dict for faster lookup
    revenue_dict = {item["month"]: item for item in bookings_by_month}

    # Prepare datasets
    gross_revenues = []
    net_revenues = []

    for month in month_labels:
        if month in revenue_dict:
            gross_revenues.append(float(revenue_dict[month]["gross_revenue"] or 0))
            net_revenues.append(float(revenue_dict[month]["net_revenue"] or 0))
        else:
            gross_revenues.append(0)
            net_revenues.append(0)

    chart_data = {
        "type": "bar",
        "data": {
            "labels": month_labels,
            "datasets": [
                {
                    "label": "Gross Revenue",
                    "data": gross_revenues,
                    "backgroundColor": "rgba(54, 162, 235, 0.5)",
                    "borderColor": "rgba(54, 162, 235, 1)",
                    "borderWidth": 1,
                },
                {
                    "label": "Net Revenue",
                    "data": net_revenues,
                    "backgroundColor": "rgba(75, 192, 192, 0.5)",
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "borderWidth": 1,
                },
            ],
        },
        "options": {
            "scales": {
                "y": {
                    "beginAtZero": True,
                    "title": {"display": True, "text": "Revenue"},
                }
            }
        },
    }

    # Cache for 1 hour
    cache.set(cache_key, chart_data, 3600)

    return chart_data
