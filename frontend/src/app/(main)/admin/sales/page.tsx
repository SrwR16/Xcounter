"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Types
interface SalesData {
  date: string;
  tickets: number;
  revenue: number;
  avgTicketPrice: number;
}

interface MovieSales {
  id: string;
  title: string;
  sales: number;
  revenue: number;
  posterUrl: string;
}

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">("week");

  // Fetch sales data
  const { data: salesData, isLoading: salesLoading } = useQuery<SalesData[]>({
    queryKey: ["salesData", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock sales data
      const today = new Date();
      const data: SalesData[] = [];

      let daysToGenerate = 7;
      if (dateRange === "today") daysToGenerate = 1;
      if (dateRange === "month") daysToGenerate = 30;
      if (dateRange === "year") daysToGenerate = 365;

      for (let i = 0; i < daysToGenerate; i++) {
        const date = subDays(today, i);
        const dayValue = date.getDay(); // 0 = Sunday, 6 = Saturday

        // Weekend boost
        const isWeekend = dayValue === 0 || dayValue === 6;
        const baseTickets = isWeekend ? 80 + Math.floor(Math.random() * 50) : 40 + Math.floor(Math.random() * 30);

        // Add some randomness but keep the trend
        const tickets = baseTickets + (daysToGenerate - i) * (Math.random() * 0.5);
        const avgPrice = 12.5 + (Math.random() * 2 - 1);
        const revenue = tickets * avgPrice;

        data.push({
          date: format(date, "yyyy-MM-dd"),
          tickets: Math.floor(tickets),
          revenue: parseFloat(revenue.toFixed(2)),
          avgTicketPrice: parseFloat(avgPrice.toFixed(2)),
        });
      }

      // Sort by date ascending
      return data.sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!user,
  });

  // Fetch top selling movies
  const { data: topMovies, isLoading: moviesLoading } = useQuery<MovieSales[]>({
    queryKey: ["topMovies", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate mock top movies data
      return [
        {
          id: "movie-1",
          title: "The Space Beyond",
          sales: 845,
          revenue: 10987.55,
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        },
        {
          id: "movie-2",
          title: "Eternal Echoes",
          sales: 723,
          revenue: 9399.0,
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        },
        {
          id: "movie-3",
          title: "Dark Horizon",
          sales: 612,
          revenue: 7956.0,
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        },
        {
          id: "movie-4",
          title: "Crystal Kingdom",
          sales: 589,
          revenue: 7657.0,
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        },
        {
          id: "movie-5",
          title: "Velocity",
          sales: 432,
          revenue: 5616.0,
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        },
      ];
    },
    enabled: !!user,
  });

  // Calculate totals
  const calculateTotals = () => {
    if (!salesData || salesData.length === 0) return { tickets: 0, revenue: 0 };

    return salesData.reduce(
      (acc, day) => ({
        tickets: acc.tickets + day.tickets,
        revenue: acc.revenue + day.revenue,
      }),
      { tickets: 0, revenue: 0 }
    );
  };

  const totals = calculateTotals();

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-4 md:mb-0">Sales Reports</h1>
          </div>

          {/* Role validation message */}
          {user?.role !== "SALESMAN" && user?.role !== "ADMIN" && user?.role !== "MODERATOR" && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You don't have sales reporting privileges. This interface is shown for demonstration purposes only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date range selector */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Time Period:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDateRange("today")}
                    className={`px-4 py-2 text-sm rounded-md ${
                      dateRange === "today" ? "bg-primary-100 text-primary-800" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange("week")}
                    className={`px-4 py-2 text-sm rounded-md ${
                      dateRange === "week" ? "bg-primary-100 text-primary-800" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDateRange("month")}
                    className={`px-4 py-2 text-sm rounded-md ${
                      dateRange === "month" ? "bg-primary-100 text-primary-800" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setDateRange("year")}
                    className={`px-4 py-2 text-sm rounded-md ${
                      dateRange === "year" ? "bg-primary-100 text-primary-800" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Last Year
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-primary-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tickets Sold</dt>
                    <dd>
                      {salesLoading ? (
                        <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">{totals.tickets.toLocaleString()}</div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd>
                      {salesLoading ? (
                        <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          $
                          {totals.revenue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Ticket Price</dt>
                    <dd>
                      {salesLoading ? (
                        <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          ${(totals.revenue / totals.tickets).toFixed(2)}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales data table */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Sales by Day</h2>
              </div>

              {salesLoading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : !salesData || salesData.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No sales data available for this period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tickets Sold
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Revenue
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Average Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesData.map((day) => {
                        const date = parseISO(day.date);
                        const formattedDate = format(date, "MMM d, yyyy");
                        const isToday = format(new Date(), "yyyy-MM-dd") === day.date;

                        return (
                          <tr key={day.date} className={isToday ? "bg-blue-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formattedDate} {isToday && <span className="ml-2 text-primary-600">(Today)</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.tickets.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              $
                              {day.revenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${day.avgTicketPrice.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top selling movies */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Top Performing Movies</h2>
              </div>

              {moviesLoading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : !topMovies || topMovies.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No movie data available for this period.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {topMovies.map((movie, index) => (
                    <div key={movie.id} className="p-4 flex items-center">
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <div className="absolute inset-0 rounded-md overflow-hidden">
                          <img src={movie.posterUrl} alt={movie.title} className="object-cover" />
                        </div>
                        <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white ring-2 ring-white">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900">{movie.title}</h3>
                          <p className="text-sm font-medium text-gray-900">
                            $
                            {movie.revenue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{movie.sales.toLocaleString()} tickets sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => router.push("/admin/sales/movies")}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all movie sales →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
