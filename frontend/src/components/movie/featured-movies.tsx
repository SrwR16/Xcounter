"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Movie = {
  id: string;
  title: string;
  posterUrl: string;
  genres: string[];
  runtime: number;
  rating: number;
};

// Mock data for development
const mockFeaturedMovies: Movie[] = [
  {
    id: "1",
    title: "The Space Beyond",
    posterUrl: "/images/movie-1.jpg",
    genres: ["Sci-Fi", "Adventure"],
    runtime: 142,
    rating: 4.7,
  },
  {
    id: "2",
    title: "Eternal Echoes",
    posterUrl: "/images/movie-2.jpg",
    genres: ["Drama", "Romance"],
    runtime: 128,
    rating: 4.5,
  },
  {
    id: "3",
    title: "Dark Horizon",
    posterUrl: "/images/movie-3.jpg",
    genres: ["Thriller", "Mystery"],
    runtime: 115,
    rating: 4.3,
  },
  {
    id: "4",
    title: "Neon Nights",
    posterUrl: "/images/movie-4.jpg",
    genres: ["Action", "Crime"],
    runtime: 136,
    rating: 4.6,
  },
];

export default function FeaturedMovies() {
  // In a real implementation, fetch data from the API
  const {
    data: movies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["featuredMovies"],
    queryFn: async () => {
      // For development, return mock data
      // In production, uncomment the API call
      // const response = await axios.get('/api/movies/featured');
      // return response.data;
      return new Promise<Movie[]>((resolve) => {
        setTimeout(() => resolve(mockFeaturedMovies), 500);
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 rounded-lg aspect-[2/3] w-full" />
            <div className="mt-3 h-6 bg-gray-300 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-300 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load movies. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {movies?.map((movie) => (
        <Link href={`/movies/${movie.id}`} key={movie.id} className="group">
          <div className="overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 transform group-hover:shadow-xl group-hover:-translate-y-1">
            <div className="relative aspect-[2/3] w-full bg-gray-200">
              {/* Movie Poster */}
              <div className="h-full w-full bg-gradient-to-b from-gray-900/10 to-gray-900/80 absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-700 text-lg font-bold">
                {movie.title
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </div>

              {/* Rating Badge */}
              <div className="absolute top-2 right-2 z-20 bg-primary-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                {movie.rating}/5
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {movie.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {movie.genres.join(" • ")} • {movie.runtime} min
              </p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Now Playing</span>
                <span className="text-primary-600 text-sm font-medium group-hover:underline">Book Now</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
