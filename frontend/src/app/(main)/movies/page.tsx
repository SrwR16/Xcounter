"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { moviesApi } from "@/lib/api";
import { Movie, Show } from "@/lib/types";
import { CalendarIcon, ClockIcon, StarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";

interface MovieCardProps {
  movie: Movie;
  onBookNow?: (movieId: number) => void;
}

function MovieCard({ movie, onBookNow }: MovieCardProps) {
  const { data: shows } = useQuery({
    queryKey: ["movie-shows", movie.id],
    queryFn: () => moviesApi.getShows({ movie: movie.id }).then((res) => res.data.results),
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getShowsToday = () => {
    if (!shows) return [];
    const today = new Date().toDateString();
    return shows.filter((show) => new Date(show.start_time).toDateString() === today);
  };

  const todayShows = getShowsToday();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-96">
        <Image
          src={movie.poster || "/placeholder-movie.jpg"}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 right-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              movie.rating === "G"
                ? "bg-green-100 text-green-800"
                : movie.rating === "PG"
                ? "bg-yellow-100 text-yellow-800"
                : movie.rating === "PG-13"
                ? "bg-orange-100 text-orange-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {movie.rating}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{movie.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{movie.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDuration(movie.duration)}
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {format(new Date(movie.release_date), "MMM d, yyyy")}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Today's Showtimes</h4>
          {todayShows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {todayShows.slice(0, 3).map((show) => (
                <Link
                  key={show.id}
                  href={`/booking/${show.id}`}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs hover:bg-indigo-200 transition-colors"
                >
                  {format(new Date(show.start_time), "h:mm a")}
                </Link>
              ))}
              {todayShows.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{todayShows.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No shows today</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link
            href={`/movies/${movie.id}`}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            View Details
          </Link>
          <button
            onClick={() => onBookNow?.(movie.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

interface MovieFilters {
  genre: string;
  rating: string;
  search: string;
}

export default function MoviesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<MovieFilters>({
    genre: "",
    rating: "",
    search: "",
  });

  const { data: movies, isLoading, error } = useQuery({
    queryKey: ["movies", filters],
    queryFn: () => moviesApi.getMovies(filters).then((res) => res.data.results),
  });

  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: () => moviesApi.getGenres().then((res) => res.data),
  });

  const handleFilterChange = (key: keyof MovieFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ genre: "", rating: "", search: "" });
  };

  const handleBookNow = (movieId: number) => {
    // Redirect to movie detail page where they can select showtimes
    window.location.href = `/movies/${movieId}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center p-10 bg-white rounded-xl shadow">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Movies</h3>
              <p className="text-gray-600">Unable to load movies. Please try refreshing the page.</p>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-900 text-white rounded-xl p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Movies</h1>
            <p className="text-lg text-primary-100 max-w-3xl">
              Discover the latest blockbusters, indie gems, and timeless classics. Book your tickets today for an
              unforgettable cinematic experience.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Search input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pl-10"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Genre filter */}
              <div className="w-full md:w-auto">
                <select
                  id="genre"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange("genre", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Genres</option>
                  {genres?.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating filter */}
              <div className="w-full md:w-auto">
                <select
                  id="rating"
                  value={filters.rating}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC-17">NC-17</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Movies Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : movies && movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onBookNow={handleBookNow} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No movies found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Clear filters to see all movies
              </button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
