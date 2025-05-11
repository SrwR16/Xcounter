"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";

type ComingSoonMovie = {
  id: string;
  title: string;
  posterUrl: string;
  genres: string[];
  releaseDate: string;
  description: string;
};

// Mock data for development
const mockComingSoonMovies: ComingSoonMovie[] = [
  {
    id: "5",
    title: "Crystal Kingdom",
    posterUrl: "/images/coming-soon-1.jpg",
    genres: ["Fantasy", "Adventure"],
    releaseDate: "2025-06-15",
    description: "Journey into a magical realm where crystals hold the key to saving a dying world.",
  },
  {
    id: "6",
    title: "Velocity",
    posterUrl: "/images/coming-soon-2.jpg",
    genres: ["Action", "Thriller"],
    releaseDate: "2025-07-22",
    description: "When time is running out, speed is the only thing that can save humanity.",
  },
  {
    id: "7",
    title: "The Last Memory",
    posterUrl: "/images/coming-soon-3.jpg",
    genres: ["Drama", "Sci-Fi"],
    releaseDate: "2025-08-10",
    description: "In a world where memories can be erased, one memory holds the truth that could change everything.",
  },
];

export default function ComingSoon() {
  // In a real implementation, fetch data from the API
  const {
    data: movies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comingSoonMovies"],
    queryFn: async () => {
      // For development, return mock data
      // In production, uncomment the API call
      // const response = await axios.get('/api/movies/coming-soon');
      // return response.data;
      return new Promise<ComingSoonMovie[]>((resolve) => {
        setTimeout(() => resolve(mockComingSoonMovies), 500);
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 rounded-lg aspect-video w-full" />
            <div className="mt-4 h-6 bg-gray-300 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-300 rounded w-1/2" />
            <div className="mt-3 h-20 bg-gray-300 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load upcoming movies. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {movies?.map((movie) => (
        <div key={movie.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <div className="relative aspect-video w-full bg-gray-200">
            {/* Movie Poster - In production, use real images */}
            <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-700 text-2xl font-bold">
              {movie.title
                .split(" ")
                .map((word: string) => word[0])
                .join("")}
            </div>

            {/* Coming Soon Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-primary-600 bg-opacity-90 text-white text-center py-2 text-sm font-medium">
              Coming {format(new Date(movie.releaseDate), "MMMM d, yyyy")}
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900">{movie.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{movie.genres.join(", ")}</p>
            <p className="mt-3 text-gray-700 line-clamp-3">{movie.description}</p>

            <div className="mt-5 flex justify-between items-center">
              <Link
                href={`/movies/${movie.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                View Details
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                className="text-gray-600 hover:text-primary-600 text-sm font-medium flex items-center"
                onClick={() => alert(`Notification set for ${movie.title}`)}
              >
                Notify Me
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
