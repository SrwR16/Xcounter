"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membershipLevel: string;
}

interface Movie {
  id: string;
  title: string;
  posterUrl: string;
}

interface Showtime {
  id: string;
  movieId: string;
  date: string;
  time: string;
  screen: string;
  availableSeats: number;
  totalSeats: number;
}

interface SalesmanBooking {
  id: string;
  customer: Customer;
  movie: Movie;
  showtime: Showtime;
  seats: string[];
  total: number;
  status: "confirmed" | "cancelled" | "pending";
  createdAt: string;
  createdBy: string;
}

// Form validation schema
const customerSearchSchema = z.object({
  searchTerm: z.string().min(3, "Please enter at least 3 characters"),
});

type CustomerSearchData = z.infer<typeof customerSearchSchema>;

export default function SalesmanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "new">("bookings");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form for customer search
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerSearchData>({
    resolver: zodResolver(customerSearchSchema),
  });

  // Fetch salesman bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<SalesmanBooking[]>({
    queryKey: ["salesmanBookings", user?.id],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock booking data
      const mockBookings: SalesmanBooking[] = [];

      for (let i = 0; i < 5; i++) {
        const date = new Date();
        // Some past, some future bookings
        date.setDate(date.getDate() + (i - 2) * 3);

        mockBookings.push({
          id: `booking-${i}`,
          customer: {
            id: `customer-${i}`,
            name: ["John Smith", "Emma Johnson", "Michael Brown", "Sarah Davis", "Robert Wilson"][i],
            email: `customer${i}@example.com`,
            phone: `555-${100 + i}-${1000 + i}`,
            membershipLevel: ["regular", "silver", "silver", "gold", "platinum"][i],
          },
          movie: {
            id: `movie-${i}`,
            title: ["The Space Beyond", "Eternal Echoes", "Dark Horizon", "Neon Nights", "Crystal Kingdom"][i],
            posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
          },
          showtime: {
            id: `showtime-${i}`,
            movieId: `movie-${i}`,
            date: date.toISOString().split("T")[0],
            time: ["14:30", "16:45", "19:15", "20:30", "18:00"][i],
            screen: `Screen ${i + 1}`,
            availableSeats: 120 - i * 15 - 20,
            totalSeats: 120,
          },
          seats: Array.from({ length: i + 2 }, (_, j) => `${String.fromCharCode(65 + j)}${j + 5}`),
          total: 12.99 * (i + 2),
          status: ["confirmed", "confirmed", "pending", "confirmed", "cancelled"][i] as any,
          createdAt: new Date(date.getTime() - 86400000).toISOString(),
          createdBy: user?.name || "Salesman",
        });
      }

      return mockBookings;
    },
    enabled: !!user,
  });

  // Function to handle customer search
  const onSearchCustomer = async (data: CustomerSearchData) => {
    setIsSearching(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock search results
      const results: Customer[] = [
        {
          id: "customer-1",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "555-123-4567",
          membershipLevel: "silver",
        },
        {
          id: "customer-2",
          name: "Emma Johnson",
          email: "emma.johnson@example.com",
          phone: "555-234-5678",
          membershipLevel: "gold",
        },
        {
          id: "customer-3",
          name: "Michael Brown",
          email: "michael.brown@example.com",
          phone: "555-345-6789",
          membershipLevel: "regular",
        },
      ].filter(
        (customer) =>
          customer.name.toLowerCase().includes(data.searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(data.searchTerm.toLowerCase()) ||
          (customer.phone && customer.phone.includes(data.searchTerm))
      );

      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search customers:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to select customer
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
  };

  // Function to create new booking
  const handleCreateBooking = () => {
    if (!selectedCustomer) return;

    // In a real app, redirect to booking flow for the selected customer
    router.push(`/admin/salesman/booking/new?customerId=${selectedCustomer.id}`);
  };

  // Function to handle booking actions
  const handleBookingAction = (booking: SalesmanBooking, action: "view" | "edit" | "cancel") => {
    // In a real app, navigate to appropriate page based on action
    switch (action) {
      case "view":
        router.push(`/admin/salesman/booking/${booking.id}`);
        break;
      case "edit":
        router.push(`/admin/salesman/booking/${booking.id}/edit`);
        break;
      case "cancel":
        if (confirm("Are you sure you want to cancel this booking?")) {
          alert("Booking would be cancelled in a real app");
        }
        break;
    }
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
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-4 md:mb-0">Salesman Dashboard</h1>
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
                    You don't have salesman privileges. This interface is shown for demonstration purposes only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  className={`${
                    activeTab === "bookings"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("bookings")}
                >
                  Manage Bookings
                </button>
                <button
                  className={`${
                    activeTab === "new"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
                  onClick={() => setActiveTab("new")}
                >
                  New Booking
                </button>
              </nav>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "bookings" ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Bookings List</h2>
              </div>

              {bookingsLoading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No bookings found.</p>
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
                          Customer
                        </th>
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
                          Date & Time
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Seats
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
                      {bookings.map((booking) => {
                        // Format date
                        const bookingDate = new Date(booking.showtime.date);
                        const formattedDate = bookingDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });

                        // Determine if booking is upcoming or past
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isUpcoming = bookingDate >= today && booking.status !== "cancelled";

                        return (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{booking.customer.name}</div>
                              <div className="text-sm text-gray-500">{booking.customer.email}</div>
                              <div className="text-xs text-gray-500">
                                {booking.customer.membershipLevel.charAt(0).toUpperCase() +
                                  booking.customer.membershipLevel.slice(1)}{" "}
                                member
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{booking.movie.title}</div>
                              <div className="text-sm text-gray-500">{booking.showtime.screen}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formattedDate}</div>
                              <div className="text-sm text-gray-500">{booking.showtime.time}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {booking.seats.length} {booking.seats.length === 1 ? "seat" : "seats"}
                              </div>
                              <div className="text-sm text-gray-500">{booking.seats.join(", ")}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                              {isUpcoming && booking.status !== "cancelled" && (
                                <span className="block mt-1 text-xs text-primary-600">Upcoming</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleBookingAction(booking, "view")}
                                className="text-primary-600 hover:text-primary-900 mr-3"
                              >
                                View
                              </button>
                              {isUpcoming && booking.status !== "cancelled" && (
                                <>
                                  <button
                                    onClick={() => handleBookingAction(booking, "edit")}
                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleBookingAction(booking, "cancel")}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* New Booking Tab */
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Create New Booking</h2>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Step 1: Find or Select Customer</h3>

                  {selectedCustomer ? (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                          <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                          {selectedCustomer.phone && <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>}
                          <p className="text-sm mt-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                selectedCustomer.membershipLevel === "platinum"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : selectedCustomer.membershipLevel === "gold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : selectedCustomer.membershipLevel === "silver"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedCustomer.membershipLevel.charAt(0).toUpperCase() +
                                selectedCustomer.membershipLevel.slice(1)}{" "}
                              Member
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          <span className="sr-only">Clear selection</span>
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSearchCustomer)} className="mb-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow">
                          <label htmlFor="searchTerm" className="sr-only">
                            Search by name, email, or phone
                          </label>
                          <input
                            id="searchTerm"
                            type="text"
                            placeholder="Search by name, email, or phone"
                            className={`input ${errors.searchTerm ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            {...register("searchTerm")}
                            disabled={isSearching}
                          />
                          {errors.searchTerm && (
                            <p className="mt-1 text-sm text-red-600">{errors.searchTerm.message}</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary py-2 px-6 whitespace-nowrap"
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <span className="flex items-center">
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
                              Searching...
                            </span>
                          ) : (
                            "Search Customer"
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search results */}
                  {searchResults.length > 0 && !selectedCustomer && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Email
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Phone
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Membership
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {searchResults.map((customer) => (
                            <tr key={customer.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.phone || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.membershipLevel.charAt(0).toUpperCase() + customer.membershipLevel.slice(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  type="button"
                                  className="text-primary-600 hover:text-primary-900"
                                  onClick={() => handleSelectCustomer(customer)}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {searchResults.length === 0 && !selectedCustomer && !isSearching && (
                    <div className="text-center py-4 text-gray-500">
                      <p>Search for a customer above or create a new one.</p>
                      <button
                        type="button"
                        className="mt-2 text-primary-600 hover:underline"
                        onClick={() => alert("This would open a new customer form.")}
                      >
                        + Create New Customer
                      </button>
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Step 2: Select Movie and Showtime</h3>

                    {/* This would normally be a multi-step form with movie/showtime/seat selection */}
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="mb-4">In a complete implementation, this would continue with:</p>
                      <ol className="text-left list-decimal pl-6 mb-6 space-y-2">
                        <li>Movie selection</li>
                        <li>Showtime selection</li>
                        <li>Seat selection</li>
                        <li>Discount/promo code application</li>
                        <li>Payment processing</li>
                      </ol>

                      <div className="flex justify-center space-x-4">
                        <button type="button" className="btn btn-primary py-2 px-6" onClick={handleCreateBooking}>
                          Continue to Movie Selection
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline py-2 px-6"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
