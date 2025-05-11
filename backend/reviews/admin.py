from django.contrib import admin

from .models import Review, ReviewReply


class ReviewReplyInline(admin.TabularInline):
    model = ReviewReply
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "movie_title",
        "user_email",
        "rating",
        "title",
        "is_approved",
        "is_featured",
        "created_at",
    ]
    list_filter = ["is_approved", "is_featured", "rating", "created_at"]
    search_fields = ["movie__title", "user__email", "title", "content"]
    readonly_fields = ["created_at", "updated_at"]
    actions = ["approve_reviews", "feature_reviews"]
    inlines = [ReviewReplyInline]

    def movie_title(self, obj):
        return obj.movie.title

    def user_email(self, obj):
        return obj.user.email

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    def feature_reviews(self, request, queryset):
        queryset.update(is_featured=True)

    movie_title.short_description = "Movie"
    user_email.short_description = "User"
    approve_reviews.short_description = "Approve selected reviews"
    feature_reviews.short_description = "Feature selected reviews"


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ["id", "review_title", "user_email", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["review__title", "user__email", "content"]
    readonly_fields = ["created_at", "updated_at"]

    def review_title(self, obj):
        return f"Review of {obj.review.movie.title} by {obj.review.user.email}"

    def user_email(self, obj):
        return obj.user.email

    review_title.short_description = "Review"
    user_email.short_description = "Staff"
