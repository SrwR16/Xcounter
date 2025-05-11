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

// Show type for dropdown selection
interface Show {
  id: string;
  movie: {
    title: string;
  };
  date: string;
  time: string;
  screen: string;
  availableSeats: number;
}

// Form validation schema
const vipReservationSchema = z.object({
  showId: z.string().min(1, "Please select a show"),
  userEmail: z.string().email("Please enter a valid email address"),
  seatNumbers: z.string().min(1, "Please enter at least one seat number"),
  notes: z.string().optional(),
});

type VipReservationFormData = z.infer<typeof vipReservationSchema>;

export default function VipReservationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState("");

  // Fetch shows for dropdown
  const { data: shows, isLoading: isLoadingShows } = useQuery({
    queryKey: ["vipShows"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for demonstration
      return [
        {
          id: "show1",
          movie: { title: "Interstellar" },
          date: "2025-03-15",
          time: "19:30",
          screen: "IMAX 1",
          availableSeats: 12,
        },
        {
          id: "show2",
          movie: { title: "Inception" },
          date: "2025-03-16",
          time: "20:00",
          screen: "VIP Screen",
          availableSeats: 8,
        },
        {
          id: "show3",
          movie: { title: "The Godfather" },
          date: "2025-03-17",
          time: "18:45",
          screen: "Screen A",
          availableSeats: 24,
        },
      ] as Show[];
    },
    enabled: !!user,
  });

  // Get selected show details
  const selectedShow = shows?.find((show) => show.id === selectedShowId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VipReservationFormData>({
    resolver: zodResolver(vipReservationSchema),
    defaultValues: {
      showId: "",
      userEmail: "",
      seatNumbers: "",
      notes: "",
    },
  });

  // Watch the showId value to update selectedShowId state
  const watchedShowId = watch("showId");
  if (watchedShowId !== selectedShowId) {
    setSelectedShowId(watchedShowId);
  }

  // Handle form submission
  const onSubmit = async (data: VipReservationFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Format the data for API
      const apiPayload = {
        show_id: data.showId,
        user_email: data.userEmail,
        seat_numbers: data.seatNumbers.split(",").map((seat) => seat.trim()),
        notes: data.notes || "",
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would send the data to the API
      // await axios.post('/api/bookings/vip_reservation/', apiPayload);

      setSuccess(true);

      // Reset form values except showId
      setValue("userEmail", "");
      setValue("seatNumbers", "");
      setValue("notes", "");
    } catch (err) {
      setError("Failed to create VIP reservation. Please try again.");
      console.error("VIP reservation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not authenticated or not admin, redirect to login
  if (!authLoading && (!user || (user?.role !== "admin" && user?.role !== "moderator"))) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                VIP Ticket Reservation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Reserve special tickets for VIP guests without payment processing
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create VIP Reservation</h3>
              <p className="mt-1 text-sm text-gray-500">Fill out this form to reserve tickets for VIP guests</p>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {success && (
                <div className="mb-4 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">VIP reservation created successfully</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>The reservation has been confirmed and the guest will be notified.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="showId" className="block text-sm font-medium text-gray-700">
                      Select Show
                    </label>
                    <select
                      id="showId"
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                        errors.showId ? "border-red-300" : ""
                      }`}
                      {...register("showId")}
                      disabled={isSubmitting || isLoadingShows}
                    >
                      <option value="">Select a movie showing</option>
                      {shows?.map((show) => (
                        <option key={show.id} value={show.id}>
                          {show.movie.title} - {new Date(show.date).toLocaleDateString()} at {show.time} ({show.screen})
                        </option>
                      ))}
                    </select>
                    {errors.showId && <p className="mt-1 text-sm text-red-600">{errors.showId.message}</p>}

                    {selectedShow && (
                      <p className="mt-2 text-sm text-gray-500">Available seats: {selectedShow.availableSeats}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
                      Guest Email
                    </label>
                    <input
                      type="email"
                      id="userEmail"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        errors.userEmail ? "border-red-300" : ""
                      }`}
                      placeholder="vip@example.com"
                      {...register("userEmail")}
                      disabled={isSubmitting}
                    />
                    {errors.userEmail && <p className="mt-1 text-sm text-red-600">{errors.userEmail.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="seatNumbers" className="block text-sm font-medium text-gray-700">
                      Seat Numbers (comma separated)
                    </label>
                    <input
                      type="text"
                      id="seatNumbers"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        errors.seatNumbers ? "border-red-300" : ""
                      }`}
                      placeholder="A1, A2, A3"
                      {...register("seatNumbers")}
                      disabled={isSubmitting}
                    />
                    {errors.seatNumbers && <p className="mt-1 text-sm text-red-600">{errors.seatNumbers.message}</p>}
                    <p className="mt-1 text-sm text-gray-500">
                      Enter seat numbers separated by commas (e.g., A1, A2, B5)
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Special Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Any special requests or information about the VIP guest"
                      {...register("notes")}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/dashboard")}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create VIP Reservation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
