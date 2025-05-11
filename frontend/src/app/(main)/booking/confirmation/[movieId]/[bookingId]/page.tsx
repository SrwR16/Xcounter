"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Types
interface BookingDetails {
  id: string;
  status: "confirmed" | "cancelled" | "pending";
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    duration: number;
  };
  showtime: {
    id: string;
    date: string;
    time: string;
    screen: string;
  };
  seats: {
    id: string;
    row: string;
    number: number;
    type: string;
    price: number;
  }[];
  payment: {
    method: string;
    total: number;
    discount: number;
    subtotal: number;
    couponCode?: string;
    couponDiscount?: number;
  };
  customer: {
    name: string;
    email: string;
    membershipLevel?: string;
  };
  createdAt: string;
  confirmationCode: string;
}

export default function BookingConfirmationPage({ params }: { params: { movieId: string; bookingId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<BookingDetails>({
    queryKey: ["booking", params.bookingId],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock booking data
      return {
        id: params.bookingId,
        status: "confirmed",
        movie: {
          id: params.movieId,
          title: "The Space Beyond",
          posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
          duration: 142,
        },
        showtime: {
          id: "showtime-123",
          date: new Date().toISOString().split("T")[0], // Today
          time: "19:30",
          screen: "Screen 3",
        },
        seats: [
          { id: "G-8", row: "G", number: 8, type: "premium", price: 14.99 },
          { id: "G-9", row: "G", number: 9, type: "premium", price: 14.99 },
          { id: "G-10", row: "G", number: 10, type: "premium", price: 14.99 },
        ],
        payment: {
          method: "credit-card",
          total: 33.74,
          discount: 11.24,
          subtotal: 44.97,
          couponCode: "MOVIE25",
          couponDiscount: 25,
        },
        customer: {
          name: user?.name || "Guest User",
          email: user?.email || "guest@example.com",
          membershipLevel: "Silver",
        },
        createdAt: new Date().toISOString(),
        confirmationCode: `XC${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      };
    },
    enabled: !!user,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, we would call an API endpoint that returns a PDF file
      // For now, we'll just simulate a successful download
      alert("Ticket PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download ticket. Please try again later.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle email resend
  const handleResendEmail = async () => {
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 800));
    alert("Confirmation email resent successfully!");
  };

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Format date and time
  const formattedDate = new Date(booking.showtime.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-green-800 mb-2">Booking Confirmed!</h2>
            <p className="text-green-700 mb-2">
              Your booking has been confirmed and tickets have been sent to your email.
            </p>
            <p className="text-green-600 font-medium">
              Confirmation Code: <span className="font-bold">{booking.confirmationCode}</span>
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <Image
                    src={booking.movie.posterUrl}
                    alt={booking.movie.title}
                    width={120}
                    height={180}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{booking.movie.title}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center text-gray-700 gap-2 sm:gap-6 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{booking.showtime.time}</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-2"
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
                      <span>{booking.showtime.screen}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                      {booking.seats.length} {booking.seats.length === 1 ? "Ticket" : "Tickets"}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {booking.customer.membershipLevel && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {booking.customer.membershipLevel} Member
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
                <dl className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-gray-500">Booked On</div>
                  <div className="col-span-2 text-sm text-gray-900">{new Date(booking.createdAt).toLocaleString()}</div>

                  <div className="col-span-1 text-sm font-medium text-gray-500">Booking ID</div>
                  <div className="col-span-2 text-sm text-gray-900">{booking.id}</div>

                  <div className="col-span-1 text-sm font-medium text-gray-500">Customer</div>
                  <div className="col-span-2 text-sm text-gray-900">{booking.customer.name}</div>

                  <div className="col-span-1 text-sm font-medium text-gray-500">Email</div>
                  <div className="col-span-2 text-sm text-gray-900">{booking.customer.email}</div>

                  <div className="col-span-1 text-sm font-medium text-gray-500">Seats</div>
                  <div className="col-span-2 text-sm text-gray-900">
                    {booking.seats
                      .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number)
                      .map((seat) => `${seat.row}${seat.number} (${seat.type})`)
                      .join(", ")}
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                    <dd className="text-sm text-gray-900">${booking.payment.subtotal.toFixed(2)}</dd>
                  </div>

                  {booking.payment.couponCode && (
                    <div className="flex justify-between text-green-600">
                      <dt className="text-sm font-medium">
                        Coupon Discount ({booking.payment.couponCode} - {booking.payment.couponDiscount}%)
                      </dt>
                      <dd className="text-sm">-${booking.payment.discount.toFixed(2)}</dd>
                    </div>
                  )}

                  <div className="flex justify-between font-bold pt-3 border-t border-gray-100">
                    <dt className="text-sm">Total</dt>
                    <dd className="text-sm">${booking.payment.total.toFixed(2)}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                    <dd className="text-sm text-gray-900">
                      {booking.payment.method === "credit-card" ? "Credit Card" : "PayPal"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions section */}
            <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-4">
              <button
                type="button"
                className="btn btn-primary py-2 px-4 flex items-center"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
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
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Ticket PDF
                  </>
                )}
              </button>

              <button type="button" className="btn btn-outline py-2 px-4 flex items-center" onClick={handleResendEmail}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Resend Email
              </button>

              <Link href="/account/bookings" className="btn btn-outline py-2 px-4 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View All Bookings
              </Link>
            </div>
          </div>

          {/* Additional information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Important Information</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Arrival Time:</strong> Please arrive at least 15 minutes before the show starts. The
                confirmation code must be presented at the ticket counter or scanned at the kiosk.
              </p>
              <p>
                <strong>Cancellation Policy:</strong> Tickets can be cancelled up to 2 hours before the show for a full
                refund. After that, no refunds will be provided.
              </p>
              <p>
                <strong>Food & Beverages:</strong> Outside food and beverages are not allowed. Refreshments are
                available at our concession stands.
              </p>
              <p>
                <strong>Need Help?</strong> If you have any questions or need assistance, please contact our customer
                service at{" "}
                <a href="mailto:support@xcounter.example.com" className="text-primary-600 hover:text-primary-800">
                  support@xcounter.example.com
                </a>
                or call{" "}
                <a href="tel:+15551234567" className="text-primary-600 hover:text-primary-800">
                  +1 (555) 123-4567
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
