import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking
from movies.models import Movie, Show
from notifications.models import Notification, NotificationType
from notifications.utils import send_notification_email

User = get_user_model()


class Command(BaseCommand):
    help = "Sends automated system notifications based on various triggers"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform a dry run without actually sending notifications",
        )
        parser.add_argument(
            "--include-past",
            action="store_true",
            help="Include processing past events (by default only future events are considered)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        include_past = options["include_past"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "*** DRY RUN MODE - No notifications will be sent ***"
                )
            )

        # Process different notification types
        self.process_upcoming_shows(dry_run, include_past)
        self.process_booking_reminders(dry_run, include_past)
        self.process_movie_premieres(dry_run, include_past)
        self.process_inactive_users(dry_run)
        self.process_system_announcements(dry_run)

        self.stdout.write(
            self.style.SUCCESS("Automated notifications processing completed")
        )

    def process_upcoming_shows(self, dry_run, include_past):
        """Process notifications for upcoming shows (24 hours before)"""
        self.stdout.write("Processing upcoming show notifications...")

        now = timezone.now()
        tomorrow = now + datetime.timedelta(days=1)

        # Find shows happening approximately 24 hours from now (with 30 min buffer)
        shows = Show.objects.filter(
            start_time__gt=tomorrow - datetime.timedelta(minutes=30),
            start_time__lt=tomorrow + datetime.timedelta(minutes=30),
        ).select_related("movie")

        count = 0
        for show in shows:
            # Get all users with bookings for this show
            bookings = Booking.objects.filter(show=show)
            users = User.objects.filter(booking__in=bookings).distinct()

            movie_title = show.movie.title if show.movie else "Unknown Movie"
            show_time = show.start_time.strftime("%A, %B %d at %I:%M %p")

            # Create notification for each user
            for user in users:
                # Check if we've already sent this notification
                existing = Notification.objects.filter(
                    user=user,
                    notification_type=NotificationType.SHOW_REMINDER,
                    related_id=str(show.id),
                )

                if not existing.exists():
                    subject = "Reminder: Your show is tomorrow"
                    content = f"""
                    <h2>Show Reminder</h2>
                    <p>This is a friendly reminder that you have tickets for <strong>{movie_title}</strong>
                    scheduled for <strong>{show_time}</strong>.</p>
                    <p>Please arrive at least 15 minutes before the show starts to avoid any delays.</p>
                    <p>We look forward to seeing you!</p>
                    """

                    if not dry_run:
                        notification = Notification.objects.create(
                            user=user,
                            notification_type=NotificationType.SHOW_REMINDER,
                            subject=subject,
                            content=content,
                            related_id=str(show.id),
                            is_email_sent=False,
                        )
                        send_notification_email(notification)
                        count += 1
                    else:
                        self.stdout.write(
                            f"Would send show reminder to {user.email} for {movie_title}"
                        )
                        count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Processed {count} upcoming show notifications")
        )

    def process_booking_reminders(self, dry_run, include_past):
        """Process notifications for recent bookings that need confirmation"""
        self.stdout.write("Processing booking confirmation reminders...")

        now = timezone.now()

        # Find bookings from the last 2 days that haven't been confirmed
        time_threshold = now - datetime.timedelta(days=2)
        bookings = Booking.objects.filter(
            created_at__gt=time_threshold,
            is_confirmed=False,
        ).select_related("user", "show__movie")

        count = 0
        for booking in bookings:
            user = booking.user
            movie_title = (
                booking.show.movie.title
                if booking.show and booking.show.movie
                else "Unknown Movie"
            )

            # Check if we've already sent this notification
            existing = Notification.objects.filter(
                user=user,
                notification_type=NotificationType.BOOKING_CONFIRMATION,
                related_id=str(booking.id),
            )

            if not existing.exists():
                subject = f"Please confirm your booking for {movie_title}"
                content = f"""
                <h2>Booking Confirmation Required</h2>
                <p>We noticed that you haven't confirmed your recent booking for <strong>{movie_title}</strong>.</p>
                <p>Please confirm your booking to secure your seats. Unconfirmed bookings may be canceled after 48 hours.</p>
                <p>Booking ID: {booking.id}</p>
                <p>Thank you for choosing XCounter!</p>
                """

                if not dry_run:
                    notification = Notification.objects.create(
                        user=user,
                        notification_type=NotificationType.BOOKING_CONFIRMATION,
                        subject=subject,
                        content=content,
                        related_id=str(booking.id),
                        is_email_sent=False,
                    )
                    send_notification_email(notification)
                    count += 1
                else:
                    self.stdout.write(
                        f"Would send booking confirmation reminder to {user.email} for booking {booking.id}"
                    )
                    count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Processed {count} booking confirmation notifications")
        )

    def process_movie_premieres(self, dry_run, include_past):
        """Process notifications for movie premieres in the next 7 days"""
        self.stdout.write("Processing movie premiere notifications...")

        now = timezone.now()
        next_week = now + datetime.timedelta(days=7)

        # Find movies premiering in the next 7 days
        premiering_shows = Show.objects.filter(
            start_time__gt=now,
            start_time__lt=next_week,
            is_premiere=True,
        ).select_related("movie")

        processed_movies = set()
        count = 0

        for show in premiering_shows:
            if not show.movie or show.movie.id in processed_movies:
                continue

            processed_movies.add(show.movie.id)
            movie = show.movie

            # Get users who have watched movies in the same genre
            related_bookings = Booking.objects.filter(
                show__movie__genre=movie.genre
            ).distinct()

            interested_users = User.objects.filter(
                booking__in=related_bookings
            ).distinct()

            for user in interested_users:
                # Check if we've already sent this notification
                existing = Notification.objects.filter(
                    user=user,
                    notification_type=NotificationType.MOVIE_PREMIERE,
                    related_id=str(movie.id),
                )

                if not existing.exists():
                    premiere_date = show.start_time.strftime("%A, %B %d")
                    subject = f"New Premiere: {movie.title} on {premiere_date}"
                    content = f"""
                    <h2>New Movie Premiere!</h2>
                    <p>We're excited to announce the premiere of <strong>{movie.title}</strong>
                    on <strong>{premiere_date}</strong>.</p>
                    <p>Based on your viewing history, we thought you might be interested in this {movie.genre} movie.</p>
                    <p>Book your tickets early to secure the best seats!</p>
                    <p>Movie description: {movie.description}</p>
                    """

                    if not dry_run:
                        notification = Notification.objects.create(
                            user=user,
                            notification_type=NotificationType.MOVIE_PREMIERE,
                            subject=subject,
                            content=content,
                            related_id=str(movie.id),
                            is_email_sent=False,
                        )
                        send_notification_email(notification)
                        count += 1
                    else:
                        self.stdout.write(
                            f"Would send premiere notification to {user.email} for {movie.title}"
                        )
                        count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Processed {count} movie premiere notifications")
        )

    def process_inactive_users(self, dry_run):
        """Process notifications for users who haven't made a booking recently"""
        self.stdout.write("Processing inactive user notifications...")

        now = timezone.now()
        one_month_ago = now - datetime.timedelta(days=30)

        # Find users who have made bookings before but not in the last month
        active_users = User.objects.filter(
            booking__created_at__gt=one_month_ago
        ).distinct()

        inactive_users = (
            User.objects.filter(booking__isnull=False)
            .exclude(id__in=active_users)
            .distinct()
        )

        count = 0
        for user in inactive_users:
            # Check if we've sent an inactive reminder in the last month
            last_inactive_reminder = Notification.objects.filter(
                user=user,
                notification_type=NotificationType.USER_INACTIVITY,
                created_at__gt=one_month_ago,
            ).first()

            if not last_inactive_reminder:
                # Get top movies current playing to recommend
                current_movies = Movie.objects.filter(
                    show__start_time__gt=now
                ).distinct()[:3]

                movie_recommendations = ""
                for movie in current_movies:
                    movie_recommendations += (
                        f"<li><strong>{movie.title}</strong> - {movie.genre}</li>"
                    )

                subject = "We miss you at XCounter!"
                content = f"""
                <h2>We miss seeing you!</h2>
                <p>It's been a while since your last visit to XCounter.</p>
                <p>We have some great movies showing now that we think you might enjoy:</p>
                <ul>
                {movie_recommendations}
                </ul>
                <p>Come back and enjoy the cinema experience again!</p>
                <p>To thank you for your loyalty, use promo code <strong>WELCOME_BACK</strong> for 10% off your next booking.</p>
                """

                if not dry_run:
                    notification = Notification.objects.create(
                        user=user,
                        notification_type=NotificationType.USER_INACTIVITY,
                        subject=subject,
                        content=content,
                        is_email_sent=False,
                    )
                    send_notification_email(notification)
                    count += 1
                else:
                    self.stdout.write(
                        f"Would send inactivity notification to {user.email}"
                    )
                    count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Processed {count} inactive user notifications")
        )

    def process_system_announcements(self, dry_run):
        """Process any pending system announcements"""
        self.stdout.write("Processing system announcements...")

        # Get all system announcements that haven't been processed yet
        announcements = Notification.objects.filter(
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            status="PENDING",
        )

        count = 0
        for announcement in announcements:
            # System announcements should be sent to all users
            if announcement.user is None:
                users = User.objects.filter(is_active=True)

                for user in users:
                    if not dry_run:
                        # Create a copy of the announcement for each user
                        user_notification = Notification.objects.create(
                            user=user,
                            notification_type=announcement.notification_type,
                            subject=announcement.subject,
                            content=announcement.content,
                            is_email_sent=False,
                        )
                        send_notification_email(user_notification)
                        count += 1
                    else:
                        self.stdout.write(
                            f"Would send system announcement to {user.email}"
                        )
                        count += 1

                # Mark the template announcement as sent
                if not dry_run:
                    announcement.status = "SENT"
                    announcement.save()

        self.stdout.write(
            self.style.SUCCESS(f"Processed {count} system announcement notifications")
        )
