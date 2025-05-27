"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useDashboardData, useDashboardMetrics, useGenerateReport } from "@/hooks/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

  // Fetch real dashboard data from backend
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics();
  const generateReportMutation = useGenerateReport();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">Unable to load dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Process dashboard data based on role and backend structure
  const processedData = dashboardData?.categories || {};
  const salesMetrics = processedData.SALES || [];
  const performanceMetrics = processedData.PERFORMANCE || [];
  const customerMetrics = processedData.CUSTOMER || [];

  // Extract key metrics for the overview cards
  const totalRevenue = salesMetrics.find((m) => m.name.toLowerCase().includes("total_sales"))?.value || 0;
  const totalBookings = performanceMetrics.find((m) => m.name.toLowerCase().includes("bookings"))?.value || 0;
  const totalCustomers = customerMetrics.find((m) => m.name.toLowerCase().includes("total_customers"))?.value || 0;
  const avgTicketPrice = salesMetrics.find((m) => m.name.toLowerCase().includes("average"))?.value || 0;

  // Extract chart data for popular movies
  const popularMoviesData = performanceMetrics.find((m) => m.name.toLowerCase().includes("popular_movies"))?.value || {
    labels: [],
    data: [],
  };

  const handleGenerateReport = async (reportType: "sales" | "movies" | "employees") => {
    try {
      const result = await generateReportMutation.mutateAsync({
        report_type: reportType,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        include_charts: true,
        sections: ["summary", "details", "recommendations"],
      });

      if (result.success) {
        toast.success("Report generated successfully!");
        // Create a download link
        const link = document.createElement("a");
        link.href = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${result.report.url}`;
        link.download = result.report.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast.error("Failed to generate report");
      console.error("Report generation error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {user.role === "ADMIN" ? "Admin Dashboard" : "Moderator Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">Overview of your cinema operations</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
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
                Performance
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Total Revenue</p>
                      <h2 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h2>
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
                      <h2 className="text-2xl font-bold text-gray-900">{totalBookings.toLocaleString()}</h2>
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
                      <p className="text-gray-500">Total Customers</p>
                      <h2 className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
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
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-500">Avg. Ticket Price</p>
                      <h2 className="text-2xl font-bold text-gray-900">${avgTicketPrice.toFixed(2)}</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Movies Chart */}
              {popularMoviesData.labels.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Popular Movies</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {popularMoviesData.labels.map((movie: string, index: number) => (
                        <div key={movie} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{movie}</span>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((popularMoviesData.data[index] / Math.max(...popularMoviesData.data)) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{popularMoviesData.data[index]} tickets</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              {salesMetrics.map((metric: any) => (
                <div key={metric.id} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{metric.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{metric.description}</p>
                  {metric.display_type === "CURRENCY" && (
                    <p className="text-3xl font-bold text-green-600">${metric.value?.toLocaleString()}</p>
                  )}
                  {metric.display_type === "NUMBER" && (
                    <p className="text-3xl font-bold text-blue-600">{metric.value?.toLocaleString()}</p>
                  )}
                  {metric.display_type === "PERCENTAGE" && (
                    <p className="text-3xl font-bold text-purple-600">{metric.value?.toFixed(1)}%</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "movies" && (
            <div className="space-y-6">
              {performanceMetrics.map((metric: any) => (
                <div key={metric.id} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{metric.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{metric.description}</p>
                  {metric.display_type === "NUMBER" && (
                    <p className="text-3xl font-bold text-blue-600">{metric.value?.toLocaleString()}</p>
                  )}
                  {metric.display_type.includes("CHART") && metric.value && (
                    <div className="mt-4">
                      <div className="space-y-2">
                        {metric.value.labels?.map((label: string, index: number) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{label}</span>
                            <span className="text-sm font-medium">{metric.value.data[index]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Generate Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate comprehensive sales and revenue reports with charts and analytics.
                  </p>
                  <button
                    onClick={() => handleGenerateReport("sales")}
                    disabled={generateReportMutation.isPending}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {generateReportMutation.isPending ? "Generating..." : "Generate Sales Report"}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Movies Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed analysis of movie performance, ratings, and audience engagement.
                  </p>
                  <button
                    onClick={() => handleGenerateReport("movies")}
                    disabled={generateReportMutation.isPending}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {generateReportMutation.isPending ? "Generating..." : "Generate Movies Report"}
                  </button>
                </div>

                {user.role === "ADMIN" && (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Employee performance metrics, salary reports, and productivity analysis.
                    </p>
                    <button
                      onClick={() => handleGenerateReport("employees")}
                      disabled={generateReportMutation.isPending}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {generateReportMutation.isPending ? "Generating..." : "Generate Employee Report"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
