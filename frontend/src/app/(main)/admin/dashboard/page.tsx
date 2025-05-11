"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStat[]>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      return [
        {
          label: "Total Revenue",
          value: "$24,856.45",
          change: 12.3,
          icon: (
            <svg
              className="w-6 h-6 text-green-600"
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
          ),
        },
        {
          label: "Tickets Sold",
          value: "1,845",
          change: 8.4,
          icon: (
            <svg
              className="w-6 h-6 text-primary-600"
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
          ),
        },
        {
          label: "Active Users",
          value: "468",
          change: 5.1,
          icon: (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ),
        },
        {
          label: "Avg. Satisfaction",
          value: "4.8/5",
          change: 0.3,
          icon: (
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          ),
        },
      ];
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
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-4 md:mb-0">Administration Dashboard</h1>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/movies" className="btn btn-outline py-2 px-4">
                Manage Movies
              </Link>
              <Link href="/admin/showtimes" className="btn btn-outline py-2 px-4">
                Manage Showtimes
              </Link>
              <Link href="/admin/users" className="btn btn-outline py-2 px-4">
                Manage Users
              </Link>
            </div>
          </div>

          {/* Role validation message */}
          {user?.role !== "ADMIN" && user?.role !== "MODERATOR" && (
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
                    You don't have admin privileges. This interface is shown for demonstration purposes only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="ml-5 w-full">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              : stats?.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-50 text-primary-600">
                        {stat.icon}
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                          <p
                            className={`ml-2 flex items-baseline text-sm font-semibold ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {stat.change >= 0 ? (
                              <svg
                                className="self-center flex-shrink-0 h-4 w-4 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="self-center flex-shrink-0 h-4 w-4 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span className="sr-only">{stat.change >= 0 ? "Increased by" : "Decreased by"}</span>
                            {Math.abs(stat.change)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/salesman"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary-50 text-primary-600">
                    <svg
                      className="h-6 w-6"
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
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">Salesman Interface</p>
                    <p className="text-sm text-gray-500">Manage bookings and customer tickets</p>
                  </div>
                </Link>

                <Link
                  href="/admin/system"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-50 text-blue-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">System Management</p>
                    <p className="text-sm text-gray-500">Execute maintenance tasks and backups</p>
                  </div>
                </Link>

                <Link
                  href="/admin/sales"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-green-50 text-green-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">Sales Reports</p>
                    <p className="text-sm text-gray-500">View sales statistics and revenue data</p>
                  </div>
                </Link>

                <Link
                  href="/admin/movies/create"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">Add New Movie</p>
                    <p className="text-sm text-gray-500">Create a new movie listing</p>
                  </div>
                </Link>

                <Link
                  href="/admin/promotions"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-yellow-50 text-yellow-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">Manage Promotions</p>
                    <p className="text-sm text-gray-500">Create and edit special offers</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              </div>

              {activitiesLoading ? (
                <div className="p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center py-3 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {activities?.map((activity) => {
                    // Determine icon based on action
                    let icon;
                    let bgColor;

                    switch (activity.action) {
                      case "created":
                        icon = (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        );
                        bgColor = "bg-green-500";
                        break;
                      case "updated":
                        icon = (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        );
                        bgColor = "bg-blue-500";
                        break;
                      case "deleted":
                        icon = (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        );
                        bgColor = "bg-red-500";
                        break;
                      case "processed":
                        icon = (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        );
                        bgColor = "bg-purple-500";
                        break;
                      default:
                        icon = (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        );
                        bgColor = "bg-gray-500";
                    }

                    // Capitalize entity type
                    const entityType = activity.entity.charAt(0).toUpperCase() + activity.entity.slice(1);

                    return (
                      <div key={activity.id} className="p-4">
                        <div className="flex items-start">
                          <div className={`${bgColor} rounded-full p-2 text-white flex-shrink-0`}>{icon}</div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.user} ({activity.userRole})
                              </div>
                              <div className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</div>
                            </div>
                            <div className="mt-1 text-sm text-gray-700">
                              <span className="font-medium capitalize">{activity.action}</span> {entityType} #
                              {activity.entityId}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-gray-200 px-6 py-4">
                <Link href="/admin/activities" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  View all activity →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
