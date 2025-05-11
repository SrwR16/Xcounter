"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// Define types for dashboard data
interface TopMovie {
  id: string;
  title: string;
  bookings: number;
  revenue: number;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  avgTicketPrice: number;
  occupancyRate: number;
}

interface DashboardData {
  revenueData: ChartData<"line">;
  genreData: ChartData<"doughnut">;
  bookingsData: ChartData<"bar">;
  topMovies: TopMovie[];
  metrics: DashboardMetrics;
}

// Mock data for development
const mockDashboardData: DashboardData = {
  revenueData: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Monthly Revenue",
        data: [12000, 19000, 15000, 22000, 20000, 25000, 28000, 32000, 38000, 35000, 42000, 50000],
        borderColor: "rgb(14, 165, 233)",
        backgroundColor: "rgba(14, 165, 233, 0.5)",
      },
    ],
  },
  genreData: {
    labels: ["Action", "Drama", "Comedy", "Sci-Fi", "Horror", "Romance"],
    datasets: [
      {
        label: "Bookings by Genre",
        data: [350, 275, 320, 190, 120, 160],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
  bookingsData: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Bookings (Last 7 Days)",
        data: [65, 72, 68, 79, 112, 158, 142],
        backgroundColor: "rgba(249, 115, 22, 0.6)",
        borderColor: "rgba(249, 115, 22, 1)",
        borderWidth: 1,
      },
    ],
  },
  topMovies: [
    { id: "1", title: "The Space Beyond", bookings: 458, revenue: 8244 },
    { id: "2", title: "Eternal Echoes", bookings: 385, revenue: 6930 },
    { id: "3", title: "Dark Horizon", bookings: 342, revenue: 6156 },
    { id: "4", title: "Neon Nights", bookings: 310, revenue: 5580 },
    { id: "5", title: "Crystal Kingdom", bookings: 275, revenue: 4950 },
  ],
  metrics: {
    totalRevenue: 245680,
    totalBookings: 4250,
    avgTicketPrice: 18.75,
    occupancyRate: 72,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not authenticated or not admin/moderator
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      // For development, return mock data
      // In production, uncomment the API call
      // const response = await axios.get('/api/dashboard/admin-dashboard');
      // return response.data;
      return new Promise<DashboardData>((resolve) => {
        setTimeout(() => resolve(mockDashboardData), 500);
      });
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
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

  // If not authenticated, render empty div (redirection handled by useEffect)
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return <div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">
              {user.role === "ADMIN" ? "Admin Dashboard" : "Moderator Dashboard"}
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.name}. Here's what's happening with your cinema today.
            </p>
          </div>

          {/* Dashboard Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`${
                  activeTab === "overview"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`${
                  activeTab === "sales"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                onClick={() => setActiveTab("sales")}
              >
                Sales & Revenue
              </button>
              <button
                className={`${
                  activeTab === "movies"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                onClick={() => setActiveTab("movies")}
              >
                Movies
              </button>
              <button
                className={`${
                  activeTab === "reports"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                onClick={() => setActiveTab("reports")}
              >
                Reports
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Total Revenue</p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        ${data?.metrics.totalRevenue.toLocaleString()}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Total Bookings</p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {data?.metrics.totalBookings.toLocaleString()}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <svg
                        className="h-8 w-8"
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
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Avg. Ticket Price</p>
                      <h2 className="text-2xl font-bold text-gray-900">${data?.metrics.avgTicketPrice}</h2>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                      <svg
                        className="h-8 w-8"
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
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Occupancy Rate</p>
                      <h2 className="text-2xl font-bold text-gray-900">{data?.metrics.occupancyRate}%</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
                  <div className="h-80">
                    {data?.revenueData && <Line data={data.revenueData} options={{ maintainAspectRatio: false }} />}
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Genre</h3>
                  <div className="h-80">
                    {data?.genreData && <Doughnut data={data.genreData} options={{ maintainAspectRatio: false }} />}
                  </div>
                </div>
              </div>

              {/* Last Week Bookings */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings (Last 7 Days)</h3>
                <div className="h-80">
                  {data?.bookingsData && <Bar data={data.bookingsData} options={{ maintainAspectRatio: false }} />}
                </div>
              </div>

              {/* Top Movies */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Movies</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Movie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bookings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.topMovies.map((movie: TopMovie) => (
                        <tr key={movie.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{movie.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">{movie.bookings}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">${movie.revenue}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-primary-600 hover:text-primary-900 mr-4">View Details</button>
                            <button className="text-primary-600 hover:text-primary-900">Generate Report</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab === "sales" && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sales & Revenue Dashboard</h2>
              <p>This section would display detailed sales reports, revenue analytics, and payment information.</p>
            </div>
          )}

          {activeTab === "movies" && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Movies Management</h2>
              <p>This section would provide tools for managing movies, shows, and theater configurations.</p>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Custom Reports</h2>
              <p>This section would allow generating and downloading various custom reports for business analysis.</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
