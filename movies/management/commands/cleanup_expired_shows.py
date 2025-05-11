import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from movies.models import Show


class Command(BaseCommand):
    help = "Cleans up expired shows that are older than the specified number of days"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Shows older than this many days will be marked as archived",
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
        delete = options["delete"]
        dry_run = options.get("dry_run", False)

        # Calculate the cutoff date
        cutoff_date = timezone.now() - datetime.timedelta(days=days)

        # Get expired shows
        expired_shows = Show.objects.filter(start_time__lt=cutoff_date)

        count = expired_shows.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f"No expired shows found older than {days} days.")
            )
            return

        if dry_run:
            if delete:
                self.stdout.write(
                    self.style.WARNING(
                        f"DRY RUN: Would delete {count} shows older than {days} days."
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"DRY RUN: Would archive {count} shows older than {days} days."
                    )
                )
            return

        if delete:
            # Delete expired shows
            expired_shows.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully deleted {count} shows older than {days} days."
                )
            )
        else:
            # Mark expired shows as archived
            expired_shows.update(is_archived=True)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully archived {count} shows older than {days} days."
                )
            )
