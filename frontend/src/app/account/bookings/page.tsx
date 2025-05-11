"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Types
interface Booking {
  id: string;
  status: "confirmed" | "cancelled" | "pending";
  movie: {
    id: string;
    title: string;
    posterUrl: string;
  };
  showtime: {
    date: string;
    time: string;
    screen: string;
  };
  seats: {
    count: number;
    seatNumbers: string[];
  };
  payment: {
    total: number;
  };
  createdAt: string;
  confirmationCode: string;
}

export default function BookingsHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);

  // Fetch booking history
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock bookings data
      const mockBookings: Booking[] = [];

      // Past bookings
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i + 1) * 3); // Past dates

        mockBookings.push({
          id: `booking-past-${i}`,
          status: i === 3 ? "cancelled" : "confirmed",
          movie: {
            id: `movie-${i}`,
            title: ["The Space Beyond", "Eternal Echoes", "Dark Horizon", "Neon Nights", "Crystal Kingdom"][i],
            posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
          },
          showtime: {
            date: date.toISOString().split("T")[0],
            time: ["14:30", "16:45", "19:15", "20:30", "18:00"][i],
            screen: `Screen ${i + 1}`,
          },
          seats: {
            count: i + 1,
            seatNumbers: Array.from({ length: i + 1 }, (_, j) => `${String.fromCharCode(65 + j)}${j + 5}`),
          },
          payment: {
            total: 12.99 * (i + 1),
          },
          createdAt: new Date(date.getTime() - 86400000).toISOString(), // 1 day before showtime
          confirmationCode: `XC${(1000 + i).toString()}`,
        });
      }

      // Upcoming bookings
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + (i + 1) * 2); // Future dates

        mockBookings.push({
          id: `booking-upcoming-${i}`,
          status: "confirmed",
          movie: {
            id: `movie-upcoming-${i}`,
            title: ["Velocity", "The Last Memory", "Ocean's Whisper"][i],
            posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
          },
          showtime: {
            date: date.toISOString().split("T")[0],
            time: ["15:45", "18:30", "20:15"][i],
            screen: `Screen ${i + 1}`,
          },
          seats: {
            count: i + 2,
            seatNumbers: Array.from({ length: i + 2 }, (_, j) => `${String.fromCharCode(70 + j)}${j + 8}`),
          },
          payment: {
            total: 12.99 * (i + 2),
          },
          createdAt: new Date().toISOString(),
          confirmationCode: `XC${(2000 + i).toString()}`,
        });
      }

      return mockBookings;
    },
    enabled: !!user,
  });

  // Handle PDF download
  const handleDownloadPDF = async (bookingId: string) => {
    setIsGeneratingPDF(bookingId);

    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, we would call an API endpoint that returns a PDF file
      alert("Ticket PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download ticket. Please try again later.");
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const filteredBookings =
    bookings?.filter((booking) => {
      const bookingDate = new Date(booking.showtime.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (activeTab === "upcoming") {
        return bookingDate >= today && booking.status !== "cancelled";
      } else if (activeTab === "past") {
        return bookingDate < today || booking.status === "cancelled";
      }

      return true;
    }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-display font-bold text-gray-900">My Bookings</h1>

            <div className="flex space-x-4">
              <Link href="/account" className="btn btn-outline py-2 px-4 flex items-center text-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My Account
              </Link>

              <Link href="/movies" className="btn btn-primary py-2 px-4 flex items-center text-sm">
                <svg
                  className="w-4 h-4 mr-2"
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
                Book New Ticket
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  className={`${
                    activeTab === "all"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("all")}
                >
                  All Bookings
                </button>
                <button
                  className={`${
                    activeTab === "upcoming"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={`${
                    activeTab === "past"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("past")}
                >
                  Past
                </button>
              </nav>
            </div>
          </div>

          {/* Bookings list */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === "upcoming"
                  ? "You don't have any upcoming bookings."
                  : activeTab === "past"
                    ? "You don't have any past bookings."
                    : "You haven't made any bookings yet."}
              </p>
              <Link href="/movies" className="btn btn-primary py-2 px-6">
                Browse Movies
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => {
                // Format date
                const bookingDate = new Date(booking.showtime.date);
                const formattedDate = bookingDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

                // Determine if booking is upcoming or past
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isUpcoming = bookingDate >= today && booking.status !== "cancelled";

                return (
                  <div key={booking.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row">
                      <div className="sm:flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                        <Image
                          src={booking.movie.posterUrl}
                          alt={booking.movie.title}
                          width={100}
                          height={150}
                          className="rounded-lg"
                        />
                      </div>

                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                          <h2 className="text-xl font-display font-bold text-gray-900 mb-2 sm:mb-0">
                            {booking.movie.title}
                          </h2>

                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>

                            {isUpcoming && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{formattedDate}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{booking.showtime.time}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{booking.showtime.screen}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">
                                {booking.seats.count} {booking.seats.count === 1 ? "Seat" : "Seats"}:{" "}
                                {booking.seats.seatNumbers.join(", ")}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">Total: ${booking.payment.total.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">Confirmation: {booking.confirmationCode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {booking.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
                              onClick={() => handleDownloadPDF(booking.id)}
                              disabled={!!isGeneratingPDF}
                            >
                              {isGeneratingPDF === booking.id ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  Download Ticket
                                </>
                              )}
                            </button>
                          )}

                          <Link
                            href={`/booking/confirmation/${booking.movie.id}/${booking.id}`}
                            className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Details
                          </Link>

                          {isUpcoming && (
                            <button
                              type="button"
                              className="btn btn-outline py-1.5 px-3 text-sm flex items-center text-red-600 hover:text-red-700 hover:border-red-700"
                              onClick={() => alert("This would allow you to cancel your booking in a real app.")}
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
