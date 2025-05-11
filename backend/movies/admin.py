from django.contrib import admin

from .models import Genre, Movie, Show, Theater


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name", "description")


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("title", "release_date", "duration_minutes", "is_active", "rating")
    list_filter = ("is_active", "release_date", "genres")
    search_fields = ("title", "description", "director", "cast")
    filter_horizontal = ("genres",)
    date_hierarchy = "release_date"
    list_editable = ("is_active",)


@admin.register(Theater)
class TheaterAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "capacity", "is_active")
    list_filter = ("is_active", "location")
    search_fields = ("name", "location", "description")
    list_editable = ("is_active",)


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = (
        "movie",
        "theater",
        "start_time",
        "end_time",
        "price",
        "show_type",
        "available_seats",
        "is_active",
    )
    list_filter = ("is_active", "show_type", "movie", "theater")
    search_fields = ("movie__title", "theater__name")
    date_hierarchy = "start_time"
    list_editable = ("is_active",)
