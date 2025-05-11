from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from movies.models import Movie
from users.models import CustomUser


class Review(models.Model):
    """
    Model for movie reviews by users
    """

    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=100)
    content = models.TextField()
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # Ensure a user can only review a movie once
        unique_together = ["movie", "user"]
        indexes = [
            models.Index(fields=["movie", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["is_approved"]),
            models.Index(fields=["is_featured"]),
        ]

    def __str__(self):
        return f"Review of {self.movie.title} by {self.user.email}"


class ReviewReply(models.Model):
    """
    Model for staff replies to reviews
    """

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="replies")
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="review_replies"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["review", "created_at"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"Reply to review #{self.review.id} by {self.user.email}"
