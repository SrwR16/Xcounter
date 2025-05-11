"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Dashboard metrics types
interface SalesMetric {
  date: string;
  revenue: number;
  tickets: number;
  average: number;
}

interface UserMetric {
  date: string;
  newUsers: number;
  activeUsers: number;
  bookingRate: number;
}

interface PopularMovie {
  id: string;
  title: string;
  ticketsSold: number;
  revenue: number;
  occupancyRate: number;
  poster?: string;
}

interface TheaterPerformance {
  id: string;
  name: string;
  revenue: number;
  ticketsSold: number;
  utilization: number;
}

interface SummaryMetrics {
  totalRevenue: number;
  totalTickets: number;
  activeUsers: number;
  averageOccupancy: number;
}

export default function AdvancedDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");

  // Fetch summary metrics
  const { data: summaryMetrics, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["dashboard-summary", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      const summaryData: SummaryMetrics = {
        totalRevenue:
          dateRange === "week" ? 12450 : dateRange === "month" ? 48750 : dateRange === "quarter" ? 145200 : 580800,
        totalTickets:
          dateRange === "week" ? 820 : dateRange === "month" ? 3250 : dateRange === "quarter" ? 9800 : 39200,
        activeUsers: dateRange === "week" ? 450 : dateRange === "month" ? 1200 : dateRange === "quarter" ? 3500 : 12000,
        averageOccupancy: dateRange === "week" ? 68 : dateRange === "month" ? 72 : dateRange === "quarter" ? 70 : 65,
      };

      return summaryData;
    },
    enabled: !!user && (user.email.includes("admin") || user.email.includes("moderator")),
  });

  // Fetch sales metrics
  const { data: salesMetrics, isLoading: isLoadingSales } = useQuery({
    queryKey: ["dashboard-sales", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Generate mock data based on date range
      const dataPoints = dateRange === "week" ? 7 : dateRange === "month" ? 30 : dateRange === "quarter" ? 90 : 365;

      const metrics: SalesMetric[] = [];
      const baseDate = new Date();

      for (let i = dataPoints - 1; i >= 0; i--) {
        const currentDate = new Date();
        currentDate.setDate(baseDate.getDate() - i);

        // Generate random but plausible data
        const dayMultiplier = [1, 0.7, 0.6, 0.8, 1.2, 1.5, 1.3][currentDate.getDay()]; // Weekend boost
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1 random factor
        const baseRevenue = 1800 * dayMultiplier * randomFactor;
        const baseTickets = 120 * dayMultiplier * randomFactor;

        metrics.push({
          date: currentDate.toISOString().split("T")[0],
          revenue: Math.round(baseRevenue),
          tickets: Math.round(baseTickets),
          average: Math.round((baseRevenue / baseTickets) * 100) / 100,
        });
      }

      return metrics;
    },
    enabled: !!user && (user.email.includes("admin") || user.email.includes("moderator")),
  });

  // Fetch user metrics
  const { data: userMetrics, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["dashboard-users", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Generate mock data based on date range
      const dataPoints = dateRange === "week" ? 7 : dateRange === "month" ? 30 : dateRange === "quarter" ? 90 : 365;

      const metrics: UserMetric[] = [];
      const baseDate = new Date();

      for (let i = dataPoints - 1; i >= 0; i--) {
        const currentDate = new Date();
        currentDate.setDate(baseDate.getDate() - i);

        // Generate random but plausible data
        const dayMultiplier = [0.8, 0.7, 0.6, 0.9, 1.1, 1.4, 1.5][currentDate.getDay()]; // Weekend boost
        const randomFactor = 0.85 + Math.random() * 0.3; // 0.85-1.15 random factor
        const baseNewUsers = 15 * dayMultiplier * randomFactor;
        const baseActiveUsers = 150 * dayMultiplier * randomFactor;
        const baseBookingRate = 0.15 * dayMultiplier * randomFactor;

        metrics.push({
          date: currentDate.toISOString().split("T")[0],
          newUsers: Math.round(baseNewUsers),
          activeUsers: Math.round(baseActiveUsers),
          bookingRate: Math.round(baseBookingRate * 100) / 100,
        });
      }

      return metrics;
    },
    enabled: !!user && (user.email.includes("admin") || user.email.includes("moderator")),
  });

  // Fetch popular movies
  const { data: popularMovies, isLoading: isLoadingMovies } = useQuery({
    queryKey: ["dashboard-movies", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "MOV001",
          title: "Avengers: Endgame",
          ticketsSold: 1250,
          revenue: 18750,
          occupancyRate: 92,
          poster: "/images/movies/avengers.jpg",
        },
        {
          id: "MOV002",
          title: "Dune: Part Two",
          ticketsSold: 980,
          revenue: 14700,
          occupancyRate: 86,
          poster: "/images/movies/dune.jpg",
        },
        {
          id: "MOV003",
          title: "The Batman",
          ticketsSold: 875,
          revenue: 13125,
          occupancyRate: 78,
          poster: "/images/movies/batman.jpg",
        },
        {
          id: "MOV004",
          title: "Oppenheimer",
          ticketsSold: 720,
          revenue: 10800,
          occupancyRate: 65,
          poster: "/images/movies/oppenheimer.jpg",
        },
        {
          id: "MOV005",
          title: "Barbie",
          ticketsSold: 680,
          revenue: 10200,
          occupancyRate: 62,
          poster: "/images/movies/barbie.jpg",
        },
      ] as PopularMovie[];
    },
    enabled: !!user && (user.email.includes("admin") || user.email.includes("moderator")),
  });

  // Fetch theater performance
  const { data: theaterPerformance, isLoading: isLoadingTheaters } = useQuery({
    queryKey: ["dashboard-theaters", dateRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "TH001",
          name: "Theater 1 (IMAX)",
          revenue: 22500,
          ticketsSold: 1200,
          utilization: 88,
        },
        {
          id: "TH002",
          name: "Theater 2 (Standard)",
          revenue: 15300,
          ticketsSold: 1020,
          utilization: 76,
        },
        {
          id: "TH003",
          name: "Theater 3 (VIP)",
          revenue: 19800,
          ticketsSold: 880,
          utilization: 82,
        },
        {
          id: "TH004",
          name: "Theater 4 (Standard)",
          revenue: 14250,
          ticketsSold: 950,
          utilization: 71,
        },
        {
          id: "TH005",
          name: "Theater 5 (3D)",
          revenue: 16800,
          ticketsSold: 960,
          utilization: 74,
        },
      ] as TheaterPerformance[];
    },
    enabled: !!user && (user.email.includes("admin") || user.email.includes("moderator")),
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Calculate trend percentage (fake data for demo)
  const getTrendPercentage = (metric: string) => {
    const trends = {
      totalRevenue: 5.2,
      totalTickets: 3.8,
      activeUsers: 7.5,
      averageOccupancy: -1.2,
    };
    return trends[metric as keyof typeof trends] || 0;
  };

  // Get trend color
  const getTrendColor = (percentage: number) => {
    return percentage >= 0 ? "text-green-600" : "text-red-600";
  };

  // Get trend icon
  const getTrendIcon = (percentage: number) => {
    return percentage >= 0 ? (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // If not authenticated or not an admin/moderator, redirect to login
  if (!authLoading && (!user || !(user.email.includes("admin") || user.email.includes("moderator")))) {
    router.push("/login");
    return null;
  }

  // Chart rendering placeholder - in a real application this would use a chart library like Chart.js or Recharts
  const SalesChart = ({ data }: { data: SalesMetric[] }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-base font-medium text-gray-900 mb-4">Sales Performance</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-sm text-gray-500 text-center">
          <p>[Sales Chart Visualization]</p>
          <p className="text-xs mt-1">Using historical sales data from {data.length} days</p>
        </div>
      </div>
    </div>
  );

  const UsersChart = ({ data }: { data: UserMetric[] }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-base font-medium text-gray-900 mb-4">User Engagement</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-sm text-gray-500 text-center">
          <p>[User Engagement Chart]</p>
          <p className="text-xs mt-1">Active users and booking rates over time</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Advanced Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">Comprehensive data visualization and performance metrics</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as "week" | "month" | "quarter" | "year")}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last 365 Days</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Revenue */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd>
                        <div className="flex items-baseline">
                          {isLoadingSummary ? (
                            <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>
                          ) : (
                            <>
                              <div className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(summaryMetrics?.totalRevenue || 0)}
                              </div>
                              <div
                                className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(getTrendPercentage("totalRevenue"))}`}
                              >
                                {getTrendIcon(getTrendPercentage("totalRevenue"))}
                                <span className="sr-only">
                                  {getTrendPercentage("totalRevenue") >= 0 ? "Increased" : "Decreased"} by
                                </span>
                                {Math.abs(getTrendPercentage("totalRevenue"))}%
                              </div>
                            </>
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Tickets */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
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
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tickets Sold</dt>
                      <dd>
                        <div className="flex items-baseline">
                          {isLoadingSummary ? (
                            <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>
                          ) : (
                            <>
                              <div className="text-2xl font-semibold text-gray-900">
                                {summaryMetrics?.totalTickets.toLocaleString() || 0}
                              </div>
                              <div
                                className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(getTrendPercentage("totalTickets"))}`}
                              >
                                {getTrendIcon(getTrendPercentage("totalTickets"))}
                                <span className="sr-only">
                                  {getTrendPercentage("totalTickets") >= 0 ? "Increased" : "Decreased"} by
                                </span>
                                {Math.abs(getTrendPercentage("totalTickets"))}%
                              </div>
                            </>
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd>
                        <div className="flex items-baseline">
                          {isLoadingSummary ? (
                            <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>
                          ) : (
                            <>
                              <div className="text-2xl font-semibold text-gray-900">
                                {summaryMetrics?.activeUsers.toLocaleString() || 0}
                              </div>
                              <div
                                className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(getTrendPercentage("activeUsers"))}`}
                              >
                                {getTrendIcon(getTrendPercentage("activeUsers"))}
                                <span className="sr-only">
                                  {getTrendPercentage("activeUsers") >= 0 ? "Increased" : "Decreased"} by
                                </span>
                                {Math.abs(getTrendPercentage("activeUsers"))}%
                              </div>
                            </>
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg. Occupancy</dt>
                      <dd>
                        <div className="flex items-baseline">
                          {isLoadingSummary ? (
                            <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>
                          ) : (
                            <>
                              <div className="text-2xl font-semibold text-gray-900">
                                {formatPercentage(summaryMetrics?.averageOccupancy || 0)}
                              </div>
                              <div
                                className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(getTrendPercentage("averageOccupancy"))}`}
                              >
                                {getTrendIcon(getTrendPercentage("averageOccupancy"))}
                                <span className="sr-only">
                                  {getTrendPercentage("averageOccupancy") >= 0 ? "Increased" : "Decreased"} by
                                </span>
                                {Math.abs(getTrendPercentage("averageOccupancy"))}%
                              </div>
                            </>
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
            {/* Sales Chart */}
            {isLoadingSales ? (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-base font-medium text-gray-900 mb-4">Sales Performance</h3>
                <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
              </div>
            ) : (
              salesMetrics && <SalesChart data={salesMetrics} />
            )}

            {/* Users Chart */}
            {isLoadingUsers ? (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-base font-medium text-gray-900 mb-4">User Engagement</h3>
                <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
              </div>
            ) : (
              userMetrics && <UsersChart data={userMetrics} />
            )}
          </div>

          {/* Popular Movies */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Movies</h3>
              <p className="mt-1 text-sm text-gray-500">Movies with the highest ticket sales and revenue</p>
            </div>

            {isLoadingMovies ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="rounded bg-gray-200 h-16 w-12"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
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
                        Movie
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
                        Occupancy Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {popularMovies?.map((movie) => (
                      <tr key={movie.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {movie.poster ? (
                                <img className="h-10 w-10 rounded object-cover" src={movie.poster} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                              <div className="text-sm text-gray-500">ID: {movie.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{movie.ticketsSold.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(movie.revenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary-600 h-2.5 rounded-full"
                                style={{ width: `${movie.occupancyRate}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-900">{formatPercentage(movie.occupancyRate)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Theater Performance */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Theater Performance</h3>
              <p className="mt-1 text-sm text-gray-500">Revenue and utilization metrics by theater</p>
            </div>

            {isLoadingTheaters ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
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
                        Theater
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
                        Tickets Sold
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {theaterPerformance?.map((theater) => (
                      <tr key={theater.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{theater.name}</div>
                          <div className="text-sm text-gray-500">ID: {theater.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(theater.revenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{theater.ticketsSold.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  theater.utilization >= 80
                                    ? "bg-green-600"
                                    : theater.utilization >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${theater.utilization}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-900">{formatPercentage(theater.utilization)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
