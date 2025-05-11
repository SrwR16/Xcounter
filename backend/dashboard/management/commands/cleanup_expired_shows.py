import logging
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from movies.models import Show

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to cleanup expired shows.
    This command will archive or delete shows that are older than a specified number of days.
    """

    help = "Archives or deletes shows that are older than a specified number of days"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Shows older than this many days will be marked as archived (default: 30)",
        )
        parser.add_argument(
            "--delete",
            action="store_true",
            help="Delete expired shows instead of marking them as archived",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform a dry run without making any changes",
        )

    def handle(self, *args, **options):
        days = options["days"]
        delete_shows = options["delete"]
        dry_run = options["dry_run"]

        # Calculate the cutoff date
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get expired shows (shows with end_time before cutoff date)
        expired_shows = Show.objects.filter(end_time__lt=cutoff_date)
        count = expired_shows.count()

        # Show what we're going to do
        action = "delete" if delete_shows else "archive"
        self.stdout.write(
            f"Found {count} expired shows older than {days} days to {action}"
        )

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No expired shows to process."))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes will be made"))
            for show in expired_shows:
                self.stdout.write(
                    f"Would {action}: {show.movie.title} at {show.theater.name} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
                )
            return

        # Process expired shows
        try:
            if delete_shows:
                # Get the IDs before deleting for reporting
                show_info = [
                    (show.id, show.movie.title, show.start_time)
                    for show in expired_shows
                ]

                # Delete the shows
                expired_shows.delete()

                for show_id, title, start_time in show_info:
                    self.stdout.write(
                        f"Deleted: Show #{show_id} - {title} on {start_time.strftime('%Y-%m-%d %H:%M')}"
                    )
            else:
                # Mark shows as archived
                for show in expired_shows:
                    show.is_archived = True
                    show.save(update_fields=["is_archived"])
                    self.stdout.write(
                        f"Archived: Show #{show.id} - {show.movie.title} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
                    )

            self.stdout.write(
                self.style.SUCCESS(f"Successfully processed {count} expired shows.")
            )

        except Exception as e:
            logger.error(f"Error processing expired shows: {str(e)}")
            raise CommandError(f"Failed to process expired shows: {str(e)}")
