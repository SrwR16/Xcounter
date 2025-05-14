"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import ProtectedRoute from "@/components/providers/protected-route";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";

interface DashboardStat {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

interface Activity {
  id: string;
  action: string;
  user: string;
  userRole: string;
  timestamp: string;
  entity: string;
  entityId: string;
}

// Define types for dashboard data
interface AdminDashboardData {
  revenueData: any;
  bookingsData: any;
  employeePerformance: any;
  topMovies: {
    id: string;
    title: string;
    revenue: number;
    bookings: number;
  }[];
  metrics: {
    totalRevenue: number;
    totalBookings: number;
    totalEmployees: number;
    activePromotions: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboard", timeframe],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - would be replaced with actual API call in production
      return {
        revenueData: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [
            {
              label: "Revenue",
              data: [12000, 19000, 15000, 22000, 20000, 25000, 28000, 32000, 38000, 35000, 42000, 50000],
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderColor: "rgb(59, 130, 246)",
              borderWidth: 1,
            },
          ],
        },
        bookingsData: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [
            {
              label: "Bookings",
              data: [420, 390, 410, 490, 480, 520, 550, 580, 620, 600, 650, 700],
              backgroundColor: "rgba(16, 185, 129, 0.5)",
              borderColor: "rgb(16, 185, 129)",
              borderWidth: 1,
            },
          ],
        },
        employeePerformance: {
          labels: ["John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", "David Wilson"],
          datasets: [
            {
              label: "Bookings Processed",
              data: [120, 98, 145, 85, 110],
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
              ],
              borderColor: [
                "rgb(255, 99, 132)",
                "rgb(54, 162, 235)",
                "rgb(255, 206, 86)",
                "rgb(75, 192, 192)",
                "rgb(153, 102, 255)",
              ],
              borderWidth: 1,
            },
          ],
        },
        topMovies: [
          { id: "1", title: "The Space Beyond", revenue: 28500, bookings: 950 },
          { id: "2", title: "Eternal Echoes", revenue: 22800, bookings: 760 },
          { id: "3", title: "Dark Horizon", revenue: 19200, bookings: 640 },
          { id: "4", title: "Neon Nights", revenue: 17400, bookings: 580 },
          { id: "5", title: "Crystal Kingdom", revenue: 16500, bookings: 550 },
        ],
        metrics: {
          totalRevenue: 338000,
          totalBookings: 6460,
          totalEmployees: 12,
          activePromotions: 5,
        },
      } as AdminDashboardData;
    },
    enabled: !!user,
  });

  // Fetch recent activity
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["recentActivities"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Define some sample activities
      return [
        {
          id: "act1",
          action: "created",
          user: "Emma Thompson",
          userRole: "Moderator",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
          entity: "movie",
          entityId: "movie1",
        },
        {
          id: "act2",
          action: "updated",
          user: "John Davis",
          userRole: "Admin",
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
          entity: "showtime",
          entityId: "show123",
        },
        {
          id: "act3",
          action: "deleted",
          user: "Sarah Miller",
          userRole: "Salesman",
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
          entity: "promotion",
          entityId: "promo45",
        },
        {
          id: "act4",
          action: "processed",
          user: "Robert Wilson",
          userRole: "Salesman",
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
          entity: "refund",
          entityId: "ref789",
        },
        {
          id: "act5",
          action: "created",
          user: "Jessica Brown",
          userRole: "Moderator",
          timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
          entity: "event",
          entityId: "event456",
        },
      ];
    },
    enabled: !!user,
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const date = new Date(timestamp);
    const diffMs = now - date.getTime();

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`;
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user?.name}. Here's an overview of your cinema's performance.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="mb-6 flex space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  timeframe === "daily" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setTimeframe("daily")}
              >
                Daily
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeframe === "weekly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setTimeframe("weekly")}
              >
                Weekly
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeframe === "monthly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setTimeframe("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeframe === "yearly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setTimeframe("yearly")}
              >
                Yearly
              </button>
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
                    activeTab === "revenue"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("revenue")}
                >
                  Revenue
                </button>
                <button
                  className={`${
                    activeTab === "employees"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("employees")}
                >
                  Employees
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

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : data ? (
              <>
                {/* Dashboard metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      ${data.metrics.totalRevenue.toLocaleString()}
                    </p>
                    <div className="mt-1 text-sm text-green-600">+12% from last month</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {data.metrics.totalBookings.toLocaleString()}
                    </p>
                    <div className="mt-1 text-sm text-green-600">+8% from last month</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{data.metrics.totalEmployees}</p>
                    <div className="mt-1 text-sm text-blue-600">2 new this month</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Active Promotions</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{data.metrics.activePromotions}</p>
                    <div className="mt-1 text-sm text-yellow-600">3 ending soon</div>
                  </div>
                </div>

                {activeTab === "overview" && (
                  <>
                    {/* Revenue and Bookings Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue</h3>
                        <div className="h-80">
                          <Line data={data.revenueData} />
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings</h3>
                        <div className="h-80">
                          <Bar data={data.bookingsData} />
                        </div>
                      </div>
                    </div>

                    {/* Top Movies */}
                    <div className="bg-white rounded-lg shadow-sm mb-8">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Top Performing Movies</h3>
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Movie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Bookings
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Avg. Ticket Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {data.topMovies.map((movie) => (
                                <tr key={movie.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {movie.title}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${movie.revenue.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {movie.bookings.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${(movie.revenue / movie.bookings).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "employees" && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Performance</h3>
                    <div className="h-80">
                      <Bar data={data.employeePerformance} />
                    </div>
                  </div>
                )}

                {/* Additional tabs would be implemented here */}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load dashboard data. Please try again later.</p>
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    </ProtectedRoute>
  );
}
