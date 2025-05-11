"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/movies/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative bg-gray-900">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10" />
        <div className="absolute inset-0 bg-black opacity-60 z-0" />
        <div className="relative h-full w-full">
          {/* Placeholder for hero image - in production, use a real high-quality movie poster or cinema image */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-secondary-900/30" />
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-20 px-4 py-32 sm:px-6 sm:py-40 lg:py-48 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Ultimate Movie Experience
            </h1>
            <p className="mt-6 text-xl text-gray-300">
              Book tickets for the latest blockbusters, explore upcoming events, and enjoy premium cinema experiences
              all in one place.
            </p>

            {/* Search bar */}
            <div className="mt-10">
              <form onSubmit={handleSearch} className="sm:flex">
                <label htmlFor="search-movie" className="sr-only">
                  Search for movies
                </label>
                <input
                  id="search-movie"
                  type="text"
                  placeholder="Search for movies, events, or theaters..."
                  className="block w-full rounded-md border-0 bg-white/10 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="mt-3 sm:ml-3 sm:mt-0 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-md bg-primary-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Quick links */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/movies/now-playing"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Now Playing
              </Link>
              <Link
                href="/movies/coming-soon"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Coming Soon
              </Link>
              <Link
                href="/events"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Special Events
              </Link>
              <Link
                href="/theaters"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Find Theaters
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
