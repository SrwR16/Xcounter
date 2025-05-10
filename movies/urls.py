from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "movies"

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r"genres", views.GenreViewSet, basename="genre")
router.register(r"movies", views.MovieViewSet, basename="movie")
router.register(r"theaters", views.TheaterViewSet, basename="theater")
router.register(r"shows", views.ShowViewSet, basename="show")

urlpatterns = [
    path("", include(router.urls)),
]
