from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Genre(models.Model):
    """Model for movie genres"""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Movie(models.Model):
    """Model for movies"""

    title = models.CharField(max_length=255)
    description = models.TextField()
    release_date = models.DateField()
    duration_minutes = models.PositiveIntegerField()
    genres = models.ManyToManyField(Genre, related_name="movies")
    poster_image = models.ImageField(upload_to="movie_posters/", blank=True, null=True)
    backdrop_image = models.ImageField(
        upload_to="movie_backdrops/", blank=True, null=True
    )
    trailer_url = models.URLField(blank=True, null=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True,
    )

    # Meta information
    director = models.CharField(max_length=255, blank=True)
    cast = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-release_date"]


class Theater(models.Model):
    """Model for theaters/halls"""

    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Show(models.Model):
    """Model for movie shows/screenings"""

    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="shows")
    theater = models.ForeignKey(Theater, on_delete=models.CASCADE, related_name="shows")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Special show types
    SHOW_TYPE_CHOICES = (
        ("REGULAR", "Regular"),
        ("PREMIERE", "Premiere"),
        ("IMAX", "IMAX"),
        ("3D", "3D"),
        ("VIP", "VIP"),
    )
    show_type = models.CharField(
        max_length=20, choices=SHOW_TYPE_CHOICES, default="REGULAR"
    )

    # Ticket availability
    total_seats = models.PositiveIntegerField()
    available_seats = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.movie.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        # If this is a new show, set available_seats equal to total_seats
        if not self.pk:
            self.available_seats = self.total_seats
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["start_time"]
        indexes = [
            models.Index(fields=["start_time", "is_active"]),
            models.Index(fields=["movie", "start_time"]),
        ]
