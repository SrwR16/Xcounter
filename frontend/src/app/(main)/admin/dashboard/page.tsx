"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import ProtectedRoute from "@/components/providers/protected-route";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  ChartBarIcon,
  UsersIcon,
  FilmIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@heroicons/react/24/outline";
import { dashboardApi } from "@/lib/api";
import { DashboardData, DashboardMetric, DashboardChart } from "@/lib/types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const iconMap = {
  users: UsersIcon,
  movies: FilmIcon,
  revenue: CurrencyDollarIcon,
  bookings: ChartBarIcon,
  default: ChartBarIcon,
};

interface MetricCardProps {
  metric: DashboardMetric;
}

function MetricCard({ metric }: MetricCardProps) {
  const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || iconMap.default;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <IconComponent className={`h-6 w-6 ${metric.color || "text-gray-400"}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{metric.name}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{metric.value}</div>
                {metric.change !== undefined && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      metric.change_type === "increase"
                        ? "text-green-600"
                        : metric.change_type === "decrease"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {metric.change_type === "increase" ? (
                      <TrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                    ) : metric.change_type === "decrease" ? (
                      <TrendingDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                    ) : null}
                    <span className="sr-only">
                      {metric.change_type === "increase" ? "Increased" : "Decreased"} by
                    </span>
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  chart: DashboardChart;
}

function ChartCard({ chart }: ChartCardProps) {
  const renderChart = () => {
    const commonOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: false,
        },
      },
      ...chart.options,
    };

    switch (chart.type) {
      case "line":
        return <Line data={chart.data} options={commonOptions} />;
      case "bar":
        return <Bar data={chart.data} options={commonOptions} />;
      case "pie":
        return <Pie data={chart.data} options={commonOptions} />;
      case "doughnut":
        return <Doughnut data={chart.data} options={commonOptions} />;
      default:
        return <Bar data={chart.data} options={commonOptions} />;
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{chart.title}</h3>
        <div className="h-80">{renderChart()}</div>
      </div>
    </div>
  );
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard", timeRange],
    queryFn: () => dashboardApi.getRoleBasedDashboard().then((res) => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
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

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    refetch();
  };

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
                  timeRange === "daily" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleTimeRangeChange("daily")}
              >
                Daily
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeRange === "weekly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleTimeRangeChange("weekly")}
              >
                Weekly
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeRange === "monthly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleTimeRangeChange("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  timeRange === "yearly" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleTimeRangeChange("yearly")}
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
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">Failed to load dashboard data. Please try again.</div>
              </div>
            ) : data ? (
              <>
                {/* Dashboard metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {data.metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                  ))}
                </div>

                {/* Charts Grid */}
                {data.charts && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {data.charts.map((chart) => (
                      <ChartCard key={chart.id} chart={chart} />
                    ))}
                  </div>
                )}

                {/* Recent Activities */}
                {data.recent_activities && data.recent_activities.length > 0 && (
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activities</h3>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {data.recent_activities.map((activity, activityIdx) => (
                            <li key={activityIdx}>
                              <div className="relative pb-8">
                                {activityIdx !== data.recent_activities.length - 1 ? (
                                  <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                      <ChartBarIcon className="h-5 w-5 text-white" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">{activity.description}</p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      {formatTimeAgo(activity.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <FilmIcon className="h-5 w-5 mr-2" />
                        Add Movie
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <UsersIcon className="h-5 w-5 mr-2" />
                        Manage Employees
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        Generate Report
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
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
