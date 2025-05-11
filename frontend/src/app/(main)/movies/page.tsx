"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Types for movie and filter options
interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  genres: string[];
  releaseDate: string;
  rating: number;
  description: string;
}

interface FilterOptions {
  genre: string | null;
  sortBy: "newest" | "rating" | "title";
}

export default function MoviesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    genre: null,
    sortBy: "newest",
  });

  // Mock data for development - would be replaced with actual API call
  const { data: movies, isLoading } = useQuery<Movie[]>({
    queryKey: ["movies"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Generate mock movies
      return Array.from({ length: 16 }, (_, i) => {
        const genres = ["Action", "Adventure", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller"];

        const randomGenres = () => {
          const shuffled = [...genres].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
        };

        // Random date within the last year
        const randomDate = () => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          return date.toISOString().split("T")[0];
        };

        return {
          id: `movie-${i + 1}`,
          title: [
            "The Space Beyond",
            "Eternal Echoes",
            "Midnight Chronicles",
            "The Last Memory",
            "Crystal Kingdom",
            "Shadow Hunter",
            "Velocity",
            "Lost Horizon",
            "Neon Knights",
            "Frozen Flames",
            "Desert Moon",
            "The Silent Echo",
            "Starlight Wanderer",
            "Ocean's Depth",
            "Mountain Pass",
            "Urban Legend",
          ][i],
          posterUrl: `https://picsum.photos/seed/movie-${i + 1}/300/450`,
          genres: randomGenres(),
          releaseDate: randomDate(),
          rating: (Math.random() * 2 + 3).toFixed(1), // Rating between 3.0 and 5.0
          description: "A captivating story that will keep you on the edge of your seat.",
        };
      });
    },
  });

  // Filter and sort movies based on user input
  const filteredMovies = movies
    ? movies
        .filter((movie) => {
          const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesGenre = !filters.genre || movie.genres.includes(filters.genre);
          return matchesSearch && matchesGenre;
        })
        .sort((a, b) => {
          switch (filters.sortBy) {
            case "newest":
              return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
            case "rating":
              return parseFloat(b.rating.toString()) - parseFloat(a.rating.toString());
            case "title":
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        })
    : [];

  // Get all unique genres from movies for filter dropdown
  const allGenres = movies ? Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort() : [];

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  value={filters.genre || ""}
                  onChange={(e) => setFilters({ ...filters, genre: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Genres</option>
                  {allGenres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort filter */}
              <div className="w-full md:w-auto">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as "newest" | "rating" | "title" })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Movie Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl shadow">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No movies found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({ genre: null, sortBy: "newest" });
                }}
                className="btn btn-primary py-2 px-6"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMovies.map((movie) => (
                <Link
                  href={`/movies/${movie.id}`}
                  key={movie.id}
                  className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative h-80">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 right-2 bg-primary-900 text-white px-2 py-1 rounded-lg text-sm font-medium">
                      ★ {movie.rating}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{movie.title}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">
                        {new Date(movie.releaseDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {movie.genres.map((genre) => (
                        <span
                          key={`${movie.id}-${genre}`}
                          className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
