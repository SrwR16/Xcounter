from rest_framework import serializers

from movies.models import Movie

from .models import Review, ReviewReply


class ReviewReplySerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    user_full_name = serializers.ReadOnlyField(source="user.get_full_name")
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = ReviewReply
        fields = [
            "id",
            "review",
            "user",
            "user_email",
            "user_full_name",
            "user_role",
            "content",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "user_email",
            "user_full_name",
            "user_role",
            "created_at",
        ]
        extra_kwargs = {"review": {"required": False}}

    def get_user_role(self, obj):
        if obj.user.is_staff:
            return "Staff"
        elif obj.user.is_moderator:
            return "Moderator"
        return None


class ReviewListSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    user_full_name = serializers.ReadOnlyField(source="user.get_full_name")
    movie_title = serializers.ReadOnlyField(source="movie.title")
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "movie",
            "movie_title",
            "user",
            "user_email",
            "user_full_name",
            "rating",
            "title",
            "content",
            "reply_count",
            "is_approved",
            "is_featured",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "user_email",
            "user_full_name",
            "movie_title",
            "reply_count",
            "is_approved",
            "is_featured",
            "created_at",
        ]
        extra_kwargs = {"user": {"required": False}}

    def get_reply_count(self, obj):
        return obj.replies.count()


class ReviewDetailSerializer(ReviewListSerializer):
    replies = ReviewReplySerializer(many=True, read_only=True)

    class Meta(ReviewListSerializer.Meta):
        fields = ReviewListSerializer.Meta.fields + ["replies"]
        read_only_fields = ReviewListSerializer.Meta.read_only_fields + ["replies"]


class MovieReviewsSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = ["id", "title", "average_rating", "review_count", "reviews"]
        read_only_fields = ["title", "average_rating", "review_count", "reviews"]

    def get_reviews(self, obj):
        # Only approved reviews should be shown
        reviews = obj.reviews.filter(is_approved=True)
        # Feature reviews first, then sort by created_at
        reviews = reviews.order_by("-is_featured", "-created_at")
        return ReviewListSerializer(reviews, many=True).data

    def get_average_rating(self, obj):
        # Calculate average rating from approved reviews
        approved_reviews = obj.reviews.filter(is_approved=True)
        if not approved_reviews.exists():
            return None
        total_rating = sum(review.rating for review in approved_reviews)
        return round(total_rating / approved_reviews.count(), 1)

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()
