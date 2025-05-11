"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Types for movie details and showtimes
interface MovieDetails {
  id: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  releaseDate: string;
  director: string;
  cast: string[];
  rating: number;
  posterUrl: string;
  trailerUrl: string;
}

interface Showtime {
  id: string;
  date: string;
  time: string;
  screen: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
}

export default function MovieDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);

  // Mock data for development
  const { data: movie, isLoading: isLoadingMovie } = useQuery<MovieDetails>({
    queryKey: ["movie", params.id],
    queryFn: async () => {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        id: params.id,
        title: "The Space Beyond",
        description:
          "A thrilling journey through space as astronauts discover a mysterious signal coming from beyond our solar system. As they venture into the unknown, they face challenges that test their resilience and humanity.",
        genre: ["Sci-Fi", "Adventure", "Drama"],
        duration: 142, // minutes
        releaseDate: "2023-11-15",
        director: "Alexandra Reynolds",
        cast: ["Michael Stevens", "Emma Clarke", "David Wong", "Sophia Martinez"],
        rating: 4.8,
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };
    },
  });

  const { data: showtimes, isLoading: isLoadingShowtimes } = useQuery<{
    dates: string[];
    showtimes: Record<string, Showtime[]>;
  }>({
    queryKey: ["showtimes", params.id],
    queryFn: async () => {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Generate dates for the next 7 days
      const dates = [];
      const showtimesByDate: Record<string, Showtime[]> = {};

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);

        // Generate 3-5 showtimes per day
        const showtimesCount = Math.floor(Math.random() * 3) + 3;
        const dailyShowtimes: Showtime[] = [];

        for (let j = 0; j < showtimesCount; j++) {
          // Random time between 10:00 and 22:00
          const hour = Math.floor(Math.random() * 12) + 10;
          const minute = Math.random() > 0.5 ? "00" : "30";
          const time = `${hour}:${minute}`;

          // Random available seats
          const totalSeats = 120;
          const availableSeats = Math.floor(Math.random() * 81) + 40; // 40-120 seats available

          dailyShowtimes.push({
            id: `${dateStr}-${j}`,
            date: dateStr,
            time: time,
            screen: `Screen ${Math.floor(Math.random() * 5) + 1}`,
            availableSeats,
            totalSeats,
            price: 12.99,
          });
        }

        // Sort showtimes by time
        dailyShowtimes.sort((a, b) => a.time.localeCompare(b.time));
        showtimesByDate[dateStr] = dailyShowtimes;
      }

      return { dates, showtimes: showtimesByDate };
    },
  });

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedShowtime(null);
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
  };

  const handleProceedToBooking = () => {
    if (selectedShowtime) {
      router.push(`/booking/${params.id}/${selectedShowtime.id}`);
    }
  };

  if (isLoadingMovie || !movie) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Format the duration in hours and minutes
  const hours = Math.floor(movie.duration / 60);
  const minutes = movie.duration % 60;
  const formattedDuration = `${hours}h ${minutes}m`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Movie Hero Section */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-8">
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row">
              <div className="md:w-1/3 lg:w-1/4 mb-6 md:mb-0">
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <Image src={movie.posterUrl} alt={movie.title} width={300} height={450} className="w-full h-auto" />
                </div>
              </div>
              <div className="md:w-2/3 lg:w-3/4 md:pl-8 text-white">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">{movie.title}</h1>

                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genre.map((genre) => (
                    <span
                      key={genre}
                      className="inline-block bg-primary-600 bg-opacity-80 px-3 py-1 text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                  <span className="inline-block bg-gray-700 bg-opacity-80 px-3 py-1 text-sm rounded-full">
                    {formattedDuration}
                  </span>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(movie.rating) ? "text-yellow-400" : "text-gray-400"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-white">{movie.rating}/5</span>
                  </div>
                  <span className="mx-4">•</span>
                  <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                </div>

                <p className="text-gray-300 mb-6">{movie.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                  <div>
                    <h3 className="text-gray-400 text-sm">Director</h3>
                    <p className="text-white font-medium">{movie.director}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-sm">Cast</h3>
                    <p className="text-white font-medium">{movie.cast.join(", ")}</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline text-white border-white hover:bg-white hover:text-black py-2 px-6"
                  >
                    Watch Trailer
                  </a>
                  <button
                    onClick={() => document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" })}
                    className="btn btn-primary py-2 px-6"
                  >
                    Book Tickets
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Showtimes Section */}
          <div id="showtimes" className="bg-white rounded-xl shadow p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Select Showtime</h2>

            {isLoadingShowtimes || !showtimes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {/* Date Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Select Date:</h3>
                  <div className="flex flex-wrap gap-3">
                    {showtimes.dates.map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedDate === date
                            ? "border-primary-600 bg-primary-50 text-primary-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Showtimes */}
                {selectedDate && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Available Showtimes:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                      {showtimes.showtimes[selectedDate].map((showtime) => (
                        <button
                          key={showtime.id}
                          onClick={() => handleShowtimeSelect(showtime)}
                          className={`p-4 rounded-lg border-2 flex flex-col items-center transition-colors ${
                            selectedShowtime?.id === showtime.id
                              ? "border-primary-600 bg-primary-50 text-primary-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          disabled={showtime.availableSeats === 0}
                        >
                          <span className="text-lg font-medium">{showtime.time}</span>
                          <span className="text-sm text-gray-600">{showtime.screen}</span>
                          <span className="text-sm mt-2 flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                              />
                            </svg>
                            ${showtime.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-xs mt-1 ${
                              showtime.availableSeats > 50
                                ? "text-green-600"
                                : showtime.availableSeats > 20
                                  ? "text-orange-600"
                                  : "text-red-600"
                            }`}
                          >
                            {showtime.availableSeats} seats left
                          </span>
                        </button>
                      ))}
                    </div>

                    {selectedShowtime && (
                      <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                        <div>
                          <p className="text-gray-700">
                            <span className="font-medium">Selected:</span>{" "}
                            {new Date(selectedShowtime.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at {selectedShowtime.time}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Price:</span> ${selectedShowtime.price.toFixed(2)} per ticket
                          </p>
                        </div>
                        <button onClick={handleProceedToBooking} className="btn btn-primary py-2 px-6">
                          Continue to Booking
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Movie Info Tabs */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button className="w-1/3 border-b-2 border-primary-600 py-4 px-1 text-center text-primary-600 font-medium">
                  Synopsis
                </button>
                <button className="w-1/3 border-b-2 border-transparent py-4 px-1 text-center text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300">
                  Cast & Crew
                </button>
                <button className="w-1/3 border-b-2 border-transparent py-4 px-1 text-center text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300">
                  Reviews
                </button>
              </nav>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                {movie.description}
                <br />
                <br />
                In this epic adventure, astronauts venture into the unknown after receiving a mysterious signal from
                deep space. As they journey further, they face challenges that test not only their mission but their
                understanding of humanity itself. With stunning visuals and a heart-pounding score, "The Space Beyond"
                takes viewers on an unforgettable journey through the cosmos, exploring themes of discovery, sacrifice,
                and the indomitable human spirit.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
