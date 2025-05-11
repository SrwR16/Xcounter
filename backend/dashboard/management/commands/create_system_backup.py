import datetime
import logging
import os
import shutil
import sqlite3
import tarfile
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to create system backups.
    This command creates a backup of the database and optionally the media files.
    """

    help = "Creates backups of the database and media files"

    def add_arguments(self, parser):
        parser.add_argument(
            "--backup-dir",
            type=str,
            default="backups",
            help="Directory where backups will be stored (defaults to backups/ directory)",
        )
        parser.add_argument(
            "--include-media",
            action="store_true",
            help="Include media files in the backup",
        )
        parser.add_argument(
            "--compress",
            action="store_true",
            help="Compress the backup files using gzip",
        )

    def handle(self, *args, **options):
        backup_dir = options["backup_dir"]
        include_media = options["include_media"]
        compress = options["compress"]

        # Create backup directory if it doesn't exist
        Path(backup_dir).mkdir(parents=True, exist_ok=True)

        # Generate timestamp for backup filenames
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        # Database backup
        try:
            self.stdout.write("Creating database backup...")
            db_backup_path = self._backup_database(backup_dir, timestamp, compress)
            self.stdout.write(
                self.style.SUCCESS(f"Database backup created: {db_backup_path}")
            )
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise CommandError(f"Database backup failed: {str(e)}")

        # Media files backup (if requested)
        if include_media:
            try:
                self.stdout.write("Creating media files backup...")
                media_backup_path = self._backup_media(backup_dir, timestamp, compress)
                self.stdout.write(
                    self.style.SUCCESS(f"Media backup created: {media_backup_path}")
                )
            except Exception as e:
                logger.error(f"Media backup failed: {str(e)}")
                raise CommandError(f"Media backup failed: {str(e)}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Backup process completed. Files saved to {backup_dir}/"
            )
        )

    def _backup_database(self, backup_dir, timestamp, compress):
        """Backup the SQLite database."""
        db_path = settings.DATABASES["default"]["NAME"]

        if "sqlite3" in db_path:
            # SQLite database backup
            backup_filename = f"db_backup_{timestamp}.sqlite3"
            backup_path = os.path.join(backup_dir, backup_filename)

            # Create a copy of the database
            with tempfile.NamedTemporaryFile(delete=False) as tmpfile:
                # Open and lock the source database
                source_conn = sqlite3.connect(db_path)
                dest_conn = sqlite3.connect(tmpfile.name)

                # Copy the database
                source_conn.backup(dest_conn)

                # Close connections
                source_conn.close()
                dest_conn.close()

                # Move the temp file to the backup location
                shutil.copy2(tmpfile.name, backup_path)
                os.unlink(tmpfile.name)

            # Compress if requested
            if compress:
                compressed_path = f"{backup_path}.tar.gz"
                with tarfile.open(compressed_path, "w:gz") as tar:
                    tar.add(backup_path, arcname=os.path.basename(backup_path))

                # Remove the uncompressed file
                os.remove(backup_path)
                backup_path = compressed_path

        else:
            # PostgreSQL or other database
            # For PostgreSQL, use pg_dump command
            # For MySQL, use mysqldump command
            # This is a simplified implementation, you should expand based on the actual database used
            self.stdout.write(
                self.style.WARNING(
                    "Only SQLite database backup is implemented. "
                    "For PostgreSQL or MySQL, please implement the appropriate backup method."
                )
            )

            # Create a dummy backup file with information
            backup_filename = f"db_backup_info_{timestamp}.txt"
            backup_path = os.path.join(backup_dir, backup_filename)

            with open(backup_path, "w") as f:
                f.write(f"Database type: {settings.DATABASES['default']['ENGINE']}\n")
                f.write(f"Database name: {settings.DATABASES['default']['NAME']}\n")
                f.write("Backup not implemented for this database type.\n")

        return backup_path

    def _backup_media(self, backup_dir, timestamp, compress):
        """Backup the media files."""
        media_root = settings.MEDIA_ROOT

        if not os.path.exists(media_root):
            self.stdout.write(
                self.style.WARNING("Media directory does not exist. Nothing to backup.")
            )
            return None

        # Create backup filename
        backup_filename = f"media_backup_{timestamp}"
        backup_path = os.path.join(backup_dir, backup_filename)

        # Create tarball of media directory
        if compress:
            archive_path = f"{backup_path}.tar.gz"
            with tarfile.open(archive_path, "w:gz") as tar:
                # Add all files in media directory
                tar.add(media_root, arcname=os.path.basename(media_root))
        else:
            archive_path = f"{backup_path}.tar"
            with tarfile.open(archive_path, "w") as tar:
                # Add all files in media directory
                tar.add(media_root, arcname=os.path.basename(media_root))

        return archive_path
