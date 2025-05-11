import os
import shutil
import subprocess
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates a backup of the database and media files"

    def add_arguments(self, parser):
        parser.add_argument(
            "--backup-dir",
            type=str,
            default=None,
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
        """Create backups of the database and optionally media files"""
        backup_dir = options["backup_dir"] or os.path.join(settings.BASE_DIR, "backups")
        include_media = options["include_media"]
        compress = options["compress"]

        # Ensure backup directory exists
        os.makedirs(backup_dir, exist_ok=True)

        # Generate timestamp for backup files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Backup SQLite database
        if "sqlite3" in settings.DATABASES["default"]["ENGINE"]:
            self.backup_sqlite(backup_dir, timestamp, compress)
        else:
            self.stdout.write(
                self.style.WARNING(
                    "Only SQLite databases are supported for direct backup."
                )
            )

        # Backup media files if requested
        if include_media:
            self.backup_media(backup_dir, timestamp, compress)

        self.stdout.write(self.style.SUCCESS("Backup completed successfully."))

    def backup_sqlite(self, backup_dir, timestamp, compress):
        """Create a backup of a SQLite database"""
        db_path = settings.DATABASES["default"]["NAME"]
        db_filename = os.path.basename(db_path)
        backup_path = os.path.join(backup_dir, f"{db_filename}_{timestamp}.backup")

        self.stdout.write(f"Creating database backup: {backup_path}")

        try:
            # Create a copy of the database file
            shutil.copy2(db_path, backup_path)

            # Compress if requested
            if compress:
                self.compress_file(backup_path)
                self.stdout.write(
                    self.style.SUCCESS(f"Database backup compressed: {backup_path}.gz")
                )

            self.stdout.write(
                self.style.SUCCESS(f"Database backup created: {backup_path}")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Failed to create database backup: {str(e)}")
            )

    def backup_media(self, backup_dir, timestamp, compress):
        """Create a backup of media files"""
        media_path = settings.MEDIA_ROOT
        media_backup_dir = os.path.join(backup_dir, f"media_{timestamp}")
        media_archive = os.path.join(backup_dir, f"media_{timestamp}.tar")

        self.stdout.write(f"Creating media backup: {media_backup_dir}")

        try:
            # Create a directory for this backup
            os.makedirs(media_backup_dir, exist_ok=True)

            # Copy media files
            for item in os.listdir(media_path):
                source = os.path.join(media_path, item)
                dest = os.path.join(media_backup_dir, item)

                if os.path.isdir(source):
                    shutil.copytree(source, dest)
                else:
                    shutil.copy2(source, dest)

            # Create tar archive
            subprocess.run(
                ["tar", "-cf", media_archive, "-C", backup_dir, f"media_{timestamp}"]
            )

            # Remove the temporary directory after creating the archive
            shutil.rmtree(media_backup_dir)

            # Compress if requested
            if compress:
                self.compress_file(media_archive)
                self.stdout.write(
                    self.style.SUCCESS(f"Media backup compressed: {media_archive}.gz")
                )
                # Remove the uncompressed tar file
                os.remove(media_archive)

            self.stdout.write(
                self.style.SUCCESS(f"Media backup created: {media_archive}")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Failed to create media backup: {str(e)}")
            )

    def compress_file(self, file_path):
        """Compress a file using gzip"""
        try:
            subprocess.run(["gzip", file_path], check=True)
            return True
        except subprocess.CalledProcessError:
            self.stdout.write(
                self.style.WARNING(
                    f"Failed to compress {file_path}. Continuing without compression."
                )
            )
            return False
