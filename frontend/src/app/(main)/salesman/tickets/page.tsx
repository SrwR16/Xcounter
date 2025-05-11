"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Types
interface Ticket {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  showtime: string;
  theater: string;
  seat: string;
  type: "standard" | "vip" | "child";
  price: number;
  status: "issued" | "scanned" | "canceled" | "refunded";
  createdAt: string;
}

export default function SalesmanTicketsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showScanner, setShowScanner] = useState(false);

  // Fetch tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "T12345",
          bookingId: "B1001",
          customerId: "C1",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          movieTitle: "Avengers: Endgame",
          showtime: "2025-03-15 19:30",
          theater: "Theater 1",
          seat: "F5",
          type: "standard",
          price: 12.99,
          status: "issued",
          createdAt: "2025-03-13T14:22:33Z",
        },
        {
          id: "T12346",
          bookingId: "B1001",
          customerId: "C1",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          movieTitle: "Avengers: Endgame",
          showtime: "2025-03-15 19:30",
          theater: "Theater 1",
          seat: "F6",
          type: "standard",
          price: 12.99,
          status: "issued",
          createdAt: "2025-03-13T14:22:33Z",
        },
        {
          id: "T12347",
          bookingId: "B1002",
          customerId: "C2",
          customerName: "Jane Smith",
          customerEmail: "jane@example.com",
          movieTitle: "Dune: Part Two",
          showtime: "2025-03-14 20:00",
          theater: "Theater 3",
          seat: "C7",
          type: "vip",
          price: 19.99,
          status: "scanned",
          createdAt: "2025-03-12T10:15:42Z",
        },
        {
          id: "T12348",
          bookingId: "B1003",
          customerId: "C3",
          customerName: "Mike Johnson",
          customerEmail: "mike@example.com",
          movieTitle: "The Batman",
          showtime: "2025-03-16 15:45",
          theater: "Theater 2",
          seat: "H3",
          type: "child",
          price: 8.99,
          status: "canceled",
          createdAt: "2025-03-13T09:20:15Z",
        },
        {
          id: "T12349",
          bookingId: "B1004",
          customerId: "C4",
          customerName: "Emily Wilson",
          customerEmail: "emily@example.com",
          movieTitle: "Oppenheimer",
          showtime: "2025-03-14 18:15",
          theater: "Theater 4",
          seat: "D10",
          type: "standard",
          price: 12.99,
          status: "refunded",
          createdAt: "2025-03-11T16:33:21Z",
        },
      ] as Ticket[];
    },
    enabled: !!user && user.email.includes("salesman"),
  });

  // Handle QR code scanning
  const handleScanTicket = () => {
    setShowScanner(true);
  };

  const handleCancelScan = () => {
    setShowScanner(false);
  };

  // Mock function for scanning result
  const handleScanComplete = () => {
    alert("Ticket validated successfully!");
    setShowScanner(false);
  };

  // Get filtered tickets
  const getFilteredTickets = () => {
    if (!tickets) return [];

    return tickets.filter((ticket) => {
      // Filter by status
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ticket.id.toLowerCase().includes(query) ||
          ticket.customerName.toLowerCase().includes(query) ||
          ticket.customerEmail.toLowerCase().includes(query) ||
          ticket.movieTitle.toLowerCase().includes(query) ||
          ticket.seat.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format showtime
  const formatShowtime = (showtime: string) => {
    return new Date(showtime).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-blue-100 text-blue-800";
      case "scanned":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If not authenticated or not a salesman, redirect to login
  if (!authLoading && (!user || !user.email.includes("salesman"))) {
    router.push("/login");
    return null;
  }

  const filteredTickets = getFilteredTickets();

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Ticket Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage, validate, and process ticket operations</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={handleScanTicket}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 6h1m-7 7v1m-7-7H4m16 0h1M5 9a4 4 0 112 7.874M15 9a4 4 0 112 7.874"
                  />
                </svg>
                Scan Ticket
              </button>
            </div>
          </div>

          {/* Filter and Search */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:flex md:items-center">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
                  Filter by Status
                </label>
                <select
                  id="statusFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Tickets</option>
                  <option value="issued">Issued</option>
                  <option value="scanned">Scanned</option>
                  <option value="canceled">Canceled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="md:w-2/3 md:pl-4">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search by ticket ID, customer name, movie title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Scan Ticket QR Code
                        </h3>
                        <div className="mt-4">
                          <div className="bg-gray-100 p-4 flex items-center justify-center h-64 rounded-md">
                            <div className="text-center">
                              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12">
                                <p className="text-gray-500">Camera would be activated here in production</p>
                                <button
                                  type="button"
                                  onClick={handleScanComplete}
                                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                  Simulate Scan
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCancelScan}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tickets List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Tickets</h3>
            </div>

            {isLoadingTickets ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ticket Details
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
                        Showtime
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                          <div className="text-sm text-gray-500">{ticket.movieTitle}</div>
                          <div className="text-sm text-gray-500">
                            {ticket.theater} - Seat {ticket.seat}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.type === "standard" ? "Standard" : ticket.type === "vip" ? "VIP" : "Child"} - $
                            {ticket.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                          <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                          <div className="text-xs text-gray-500">ID: {ticket.customerId}</div>
                          <div className="text-xs text-gray-500">Booking: {ticket.bookingId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatShowtime(ticket.showtime)}</div>
                          <div className="text-xs text-gray-500">Created: {formatDate(ticket.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(ticket.status)}`}
                          >
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {ticket.status === "issued" && (
                            <button
                              type="button"
                              onClick={() => handleScanTicket()}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              Validate
                            </button>
                          )}
                          {ticket.status !== "refunded" && ticket.status !== "canceled" && (
                            <button
                              type="button"
                              onClick={() => alert(`Processing refund for ticket ${ticket.id}`)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Refund
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => alert(`Printing ticket ${ticket.id}`)}
                            className="text-green-600 hover:text-green-900 ml-3"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No tickets found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
