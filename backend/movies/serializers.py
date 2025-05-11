from rest_framework import serializers

from .models import Genre, Movie, Show, Theater


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ("id", "name", "description")


class MovieListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing movies"""

    genres = GenreSerializer(many=True, read_only=True)

    class Meta:
        model = Movie
        fields = ("id", "title", "release_date", "rating", "poster_image", "genres")


class MovieDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual movie retrieval"""

    genres = GenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        write_only=True,
        source="genres",
        required=False,
    )

    class Meta:
        model = Movie
        fields = (
            "id",
            "title",
            "description",
            "release_date",
            "duration_minutes",
            "genres",
            "genre_ids",
            "poster_image",
            "backdrop_image",
            "trailer_url",
            "rating",
            "director",
            "cast",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        genres_data = validated_data.pop("genres", [])
        movie = Movie.objects.create(**validated_data)
        if genres_data:
            movie.genres.set(genres_data)
        return movie

    def update(self, instance, validated_data):
        genres_data = validated_data.pop("genres", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if genres_data is not None:
            instance.genres.set(genres_data)
        return instance


class TheaterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theater
        fields = ("id", "name", "location", "capacity", "description", "is_active")


class ShowListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing shows"""

    movie_title = serializers.CharField(source="movie.title", read_only=True)
    theater_name = serializers.CharField(source="theater.name", read_only=True)

    class Meta:
        model = Show
        fields = (
            "id",
            "movie",
            "movie_title",
            "theater",
            "theater_name",
            "start_time",
            "end_time",
            "price",
            "show_type",
            "available_seats",
            "is_active",
        )


class ShowDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual show retrieval and management"""

    movie = MovieListSerializer(read_only=True)
    theater = TheaterSerializer(read_only=True)
    movie_id = serializers.PrimaryKeyRelatedField(
        queryset=Movie.objects.filter(is_active=True), source="movie", write_only=True
    )
    theater_id = serializers.PrimaryKeyRelatedField(
        queryset=Theater.objects.filter(is_active=True),
        source="theater",
        write_only=True,
    )

    class Meta:
        model = Show
        fields = (
            "id",
            "movie",
            "movie_id",
            "theater",
            "theater_id",
            "start_time",
            "end_time",
            "price",
            "show_type",
            "total_seats",
            "available_seats",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "available_seats")
