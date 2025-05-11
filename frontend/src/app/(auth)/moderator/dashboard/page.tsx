"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Types for the dashboard data
interface Ticket {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  customer: {
    id: string;
    name: string;
    email: string;
  };
  category: string;
  createdAt: string;
  lastUpdated: string;
}

interface ReportedReview {
  id: string;
  movieTitle: string;
  reviewContent: string;
  reportReason: string;
  reviewerId: string;
  reviewerName: string;
  reportedAt: string;
  status: "pending" | "reviewed" | "removed" | "approved";
}

export default function ModeratorDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"tickets" | "reviews" | "analytics">("tickets");

  // Fetch support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["moderator-tickets"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      return [
        {
          id: "ticket1",
          title: "Refund request for canceled show",
          status: "open",
          priority: "medium",
          customer: {
            id: "cust1",
            name: "Jane Smith",
            email: "jane.smith@example.com",
          },
          category: "Refund",
          createdAt: "2025-03-15T10:23:45Z",
          lastUpdated: "2025-03-15T10:23:45Z",
        },
        {
          id: "ticket2",
          title: "Website error during booking",
          status: "in_progress",
          priority: "high",
          customer: {
            id: "cust2",
            name: "Mike Johnson",
            email: "mike.j@example.com",
          },
          category: "Technical Issue",
          createdAt: "2025-03-14T16:42:10Z",
          lastUpdated: "2025-03-15T09:15:22Z",
        },
        {
          id: "ticket3",
          title: "Special accessibility requirements",
          status: "open",
          priority: "medium",
          customer: {
            id: "cust3",
            name: "Sarah Williams",
            email: "sarah.w@example.com",
          },
          category: "Accessibility",
          createdAt: "2025-03-15T08:55:30Z",
          lastUpdated: "2025-03-15T08:55:30Z",
        },
        {
          id: "ticket4",
          title: "Wrong showtime on ticket",
          status: "resolved",
          priority: "high",
          customer: {
            id: "cust4",
            name: "David Lee",
            email: "david.lee@example.com",
          },
          category: "Ticket Error",
          createdAt: "2025-03-13T12:33:21Z",
          lastUpdated: "2025-03-14T15:40:12Z",
        },
      ] as Ticket[];
    },
    enabled: !!user && activeTab === "tickets",
  });

  // Fetch reported reviews
  const { data: reportedReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reported-reviews"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      return [
        {
          id: "report1",
          movieTitle: "Dune: Part Two",
          reviewContent: "This movie contains inappropriate language and offensive content.",
          reportReason: "Contains offensive language",
          reviewerId: "user1",
          reviewerName: "JohnDoe123",
          reportedAt: "2025-03-14T14:22:10Z",
          status: "pending",
        },
        {
          id: "report2",
          movieTitle: "The Batman",
          reviewContent: "This movie is terrible and the director should be fired!",
          reportReason: "Harassment",
          reviewerId: "user2",
          reviewerName: "MovieCritic45",
          reportedAt: "2025-03-15T09:15:30Z",
          status: "pending",
        },
        {
          id: "report3",
          movieTitle: "Oppenheimer",
          reviewContent: "Contains spoilers without proper warning.",
          reportReason: "Contains spoilers",
          reviewerId: "user3",
          reviewerName: "FilmBuff77",
          reportedAt: "2025-03-13T16:40:22Z",
          status: "reviewed",
        },
      ] as ReportedReview[];
    },
    enabled: !!user && activeTab === "reviews",
  });

  // Analytics data (mock)
  const analyticsData = {
    ticketsResolved: 126,
    averageResponseTime: "4.5 hours",
    customerSatisfaction: "92%",
    pendingTickets: 15,
    reviewsModerated: 78,
    reportedReviewsThisMonth: 12,
  };

  const handleStatusChange = (ticketId: string, newStatus: Ticket["status"]) => {
    // In a real app, this would make an API call to update the ticket status
    console.log(`Updating ticket ${ticketId} to status: ${newStatus}`);
  };

  const handleReviewAction = (reviewId: string, action: "approve" | "remove") => {
    // In a real app, this would make an API call to take action on the reported review
    console.log(`Taking action ${action} on review ${reviewId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If not authenticated or not a moderator, redirect to login
  if (!authLoading && (!user || !user.email.includes("moderator"))) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Moderator Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage support tickets, reported reviews, and monitor system performance
            </p>
          </div>

          {/* Dashboard Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`${
                  activeTab === "tickets"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`${
                  activeTab === "reviews"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Reported Reviews
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`${
                  activeTab === "analytics"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Support Tickets Tab */}
            {activeTab === "tickets" && (
              <div>
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Support Tickets</h3>
                    <Link
                      href="/messages"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Open Messages
                    </Link>
                  </div>
                </div>

                {ticketsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ticket
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Priority
                          </th>
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
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                              <div className="text-sm text-gray-500">{ticket.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ticket.customer.name}</div>
                              <div className="text-sm text-gray-500">{ticket.customer.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                              >
                                {ticket.status.replace("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                              >
                                {ticket.priority.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(ticket.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <select
                                  className="block w-full text-xs rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                  defaultValue={ticket.status}
                                  onChange={(e) => handleStatusChange(ticket.id, e.target.value as Ticket["status"])}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                                <Link
                                  href={`/messages?ticket=${ticket.id}`}
                                  className="text-primary-600 hover:text-primary-900 text-sm"
                                >
                                  Reply
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No support tickets found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Reported Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Reported Reviews</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Review and moderate reported user reviews</p>
                </div>

                {reviewsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : reportedReviews && reportedReviews.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {reportedReviews.map((review) => (
                      <li key={review.id} className="p-4 sm:p-6">
                        <div className="sm:flex sm:justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              Review for: <span className="font-bold">{review.movieTitle}</span>
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              By: {review.reviewerName} • Reported: {formatDate(review.reportedAt)}
                            </p>
                            <div className="mt-3 text-sm text-gray-500">
                              <p className="font-semibold">Report reason:</p>
                              <p className="text-red-600">{review.reportReason}</p>
                            </div>
                            <div className="mt-3">
                              <p className="font-semibold text-sm text-gray-500">Review content:</p>
                              <p className="mt-1 text-gray-700 border-l-4 border-gray-200 pl-3 italic">
                                {review.reviewContent}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col space-y-2">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                review.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : review.status === "reviewed"
                                    ? "bg-blue-100 text-blue-800"
                                    : review.status === "removed"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                              }`}
                            >
                              {review.status.toUpperCase()}
                            </span>
                            {review.status === "pending" && (
                              <div className="mt-2 flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleReviewAction(review.id, "approve")}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewAction(review.id, "remove")}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No reported reviews found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div>
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Analytics Dashboard</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Key metrics and performance indicators</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Card 1 */}
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Tickets Resolved</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">{analyticsData.ticketsResolved}</div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2 */}
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Average Response Time</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {analyticsData.averageResponseTime}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3 */}
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Customer Satisfaction</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {analyticsData.customerSatisfaction}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4 */}
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
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Pending Tickets</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">{analyticsData.pendingTickets}</div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 5 */}
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Reviews Moderated</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {analyticsData.reviewsModerated}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 6 */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                            <svg
                              className="h-6 w-6 text-red-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <div className="ml-5">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Reported Reviews (Month)</dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {analyticsData.reportedReviewsThisMonth}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Over Time</h4>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Chart visualization would appear here in a real application</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
