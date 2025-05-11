"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Types
interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
}

interface Showtime {
  id: string;
  date: string;
  time: string;
  screen: string;
  price: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  type: "standard" | "premium" | "vip";
  price: number;
  status: "available" | "selected" | "booked";
}

interface Coupon {
  code: string;
  discountPercentage: number;
  isValid: boolean;
  message?: string;
}

// Form validation schema
const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function BookingPage({ params }: { params: { movieId: string; showtimeId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Form for coupon validation
  const {
    register,
    handleSubmit,
    formState: { errors: couponErrors },
    reset,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
  });

  // Fetch movie details
  const { data: movie, isLoading: isLoadingMovie } = useQuery<Movie>({
    queryKey: ["movie", params.movieId],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        id: params.movieId,
        title: "The Space Beyond",
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1450&auto=format&fit=crop",
        rating: 4.8,
      };
    },
  });

  // Fetch showtime details
  const { data: showtime, isLoading: isLoadingShowtime } = useQuery<Showtime>({
    queryKey: ["showtime", params.showtimeId],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Extract date and index from showtime ID (format: YYYY-MM-DD-index)
      const [year, month, day, index] = params.showtimeId.split("-");
      const date = `${year}-${month}-${day}`;

      // Random time between 10:00 and 22:00
      const hour = Math.floor(Math.random() * 12) + 10;
      const minute = Math.random() > 0.5 ? "00" : "30";
      const time = `${hour}:${minute}`;

      return {
        id: params.showtimeId,
        date,
        time,
        screen: `Screen ${Math.floor(Math.random() * 5) + 1}`,
        price: 12.99,
      };
    },
  });

  // Fetch available seats
  const { data: seats, isLoading: isLoadingSeats } = useQuery<Seat[]>({
    queryKey: ["seats", params.showtimeId],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate seats for the theater (10 rows A-J, 16 seats per row)
      const generatedSeats: Seat[] = [];
      const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const seatsPerRow = 16;

      rows.forEach((row) => {
        for (let i = 1; i <= seatsPerRow; i++) {
          // Determine seat type and price based on position
          let type: "standard" | "premium" | "vip" = "standard";
          let price = 12.99;

          if (row >= "D" && row <= "G" && i >= 4 && i <= 13) {
            // Middle seats are premium
            type = "premium";
            price = 14.99;
          } else if (row >= "H" && row <= "J" && i >= 4 && i <= 13) {
            // Back middle seats are VIP
            type = "vip";
            price = 19.99;
          }

          // Randomly mark some seats as booked (about 30%)
          const status = Math.random() < 0.3 ? "booked" : "available";

          generatedSeats.push({
            id: `${row}-${i}`,
            row,
            number: i,
            type,
            price,
            status,
          });
        }
      });

      return generatedSeats;
    },
  });

  // Validate coupon code
  const onSubmitCoupon = async (data: CouponFormData) => {
    // Simulate API call
    const response = await new Promise<Coupon>((resolve) => {
      setTimeout(() => {
        // Mock coupon validation
        if (data.code.toUpperCase() === "MOVIE25") {
          resolve({
            code: data.code.toUpperCase(),
            discountPercentage: 25,
            isValid: true,
            message: "25% discount applied!",
          });
        } else if (data.code.toUpperCase() === "SUMMER10") {
          resolve({
            code: data.code.toUpperCase(),
            discountPercentage: 10,
            isValid: true,
            message: "10% discount applied!",
          });
        } else if (data.code.toUpperCase() === "VIP50") {
          resolve({
            code: data.code.toUpperCase(),
            discountPercentage: 50,
            isValid: user?.role === "ADMIN" || user?.role === "MODERATOR",
            message:
              user?.role === "ADMIN" || user?.role === "MODERATOR"
                ? "50% staff discount applied!"
                : "Invalid coupon code for your account type.",
          });
        } else {
          resolve({
            code: data.code.toUpperCase(),
            discountPercentage: 0,
            isValid: false,
            message: "Invalid or expired coupon code.",
          });
        }
      }, 600);
    });

    setCoupon(response);

    if (!response.isValid) {
      // Reset the form if coupon is invalid
      setTimeout(() => {
        reset();
        setCoupon(null);
      }, 3000);
    }
  };

  // Handle seat selection
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "booked") return;

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);

      if (isSelected) {
        // Deselect the seat
        return prev.filter((s) => s.id !== seat.id);
      } else {
        // Select the seat
        return [...prev, { ...seat, status: "selected" }];
      }
    });
  };

  // Calculate subtotal, discount, and total price
  const calculatePrices = () => {
    const subtotal = selectedSeats.reduce((total, seat) => total + seat.price, 0);
    const discount = coupon?.isValid ? (subtotal * coupon.discountPercentage) / 100 : 0;
    const total = subtotal - discount;

    return { subtotal, discount, total };
  };

  // Handle booking submission
  const handleBookSubmit = async () => {
    if (selectedSeats.length === 0) return;

    try {
      setIsBooking(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setBookingSuccess(true);

      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        router.push(`/booking/confirmation/${params.movieId}/${Math.random().toString(36).substring(2, 15)}`);
      }, 2000);
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoadingMovie) {
      router.push(`/login?redirect=/booking/${params.movieId}/${params.showtimeId}`);
    }
  }, [user, isLoadingMovie, router, params.movieId, params.showtimeId]);

  if (isLoadingMovie || isLoadingShowtime || isLoadingSeats) {
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

  if (!movie || !showtime || !seats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">Error Loading Booking Details</h1>
              <p className="text-gray-700 mb-4">We couldn't load the booking details. Please try again later.</p>
              <button onClick={() => router.back()} className="btn btn-primary py-2 px-6">
                Go Back
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { subtotal, discount, total } = calculatePrices();

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Booking Header */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <Image src={movie.posterUrl} alt={movie.title} width={100} height={150} className="rounded-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{movie.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-700 gap-2 sm:gap-6">
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
                    <span>
                      {new Date(showtime.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
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
                    <span>{showtime.time}</span>
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
                    <span>{showtime.screen}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Seat Selection */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Select Your Seats</h2>

                {/* Seat selection info */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-primary-500 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-400 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">Booked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 border-2 border-blue-500 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">Premium (${showtime.price + 2})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 border-2 border-purple-500 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">VIP (${showtime.price + 7})</span>
                  </div>
                </div>

                {/* Screen */}
                <div className="relative mb-10">
                  <div className="h-2 bg-gray-300 rounded-lg mb-2"></div>
                  <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-gray-500">Screen</div>
                </div>

                {/* Seats grid */}
                <div className="w-full overflow-x-auto pb-4">
                  <div className="min-w-max">
                    {/* Group seats by row */}
                    {Array.from(new Set(seats.map((seat: Seat) => seat.row))).map((row: string) => (
                      <div key={row} className="flex justify-center mb-2">
                        <div className="w-6 text-center text-gray-700 mr-2">{row}</div>
                        <div className="flex gap-1">
                          {seats
                            .filter((seat: Seat) => seat.row === row)
                            .sort((a: Seat, b: Seat) => a.number - b.number)
                            .map((seat: Seat) => {
                              // Determine if seat is selected
                              const isSelected = selectedSeats.some((s) => s.id === seat.id);

                              // Get seat status class
                              let seatClass =
                                "w-8 h-8 flex items-center justify-center text-xs rounded-t-md cursor-pointer transition-colors";

                              if (seat.status === "booked") {
                                seatClass += " bg-gray-400 cursor-not-allowed";
                              } else if (isSelected) {
                                seatClass += " bg-primary-500 text-white";
                              } else {
                                seatClass += " bg-gray-200 hover:bg-gray-300";

                                // Add borders for premium and VIP seats
                                if (seat.type === "premium") {
                                  seatClass += " border-2 border-blue-500";
                                } else if (seat.type === "vip") {
                                  seatClass += " border-2 border-purple-500";
                                }
                              }

                              return (
                                <button
                                  key={seat.id}
                                  className={seatClass}
                                  onClick={() => handleSeatClick(seat)}
                                  disabled={seat.status === "booked"}
                                  title={`${row}${seat.number} - $${seat.price}`}
                                >
                                  {seat.number}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* Booking Summary */}
              <div className="bg-white rounded-xl shadow p-6 sticky top-6">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Booking Summary</h2>

                {selectedSeats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p>Select seats to continue</p>
                  </div>
                ) : (
                  <>
                    {/* Selected seats summary */}
                    <div className="mb-4">
                      <div className="flex justify-between text-gray-700 mb-2">
                        <span>Selected Seats:</span>
                        <span>
                          {selectedSeats
                            .sort((a: Seat, b: Seat) => a.row.localeCompare(b.row) || a.number - b.number)
                            .map((seat: Seat) => `${seat.row}${seat.number}`)
                            .join(", ")}
                        </span>
                      </div>

                      {/* Group seats by type for pricing */}
                      {["standard", "premium", "vip"].map((type: string) => {
                        const seatsOfType = selectedSeats.filter((seat: Seat) => seat.type === type);
                        if (seatsOfType.length === 0) return null;

                        return (
                          <div key={type} className="flex justify-between text-gray-600 text-sm mb-1">
                            <span>
                              {type.charAt(0).toUpperCase() + type.slice(1)} x {seatsOfType.length}:
                            </span>
                            <span>${(seatsOfType[0].price * seatsOfType.length).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Apply coupon */}
                    <div className="mb-6">
                      <form onSubmit={handleSubmit(onSubmitCoupon)} className="flex gap-2">
                        <div className="flex-grow">
                          <input
                            type="text"
                            placeholder="Have a coupon code?"
                            className={`input ${
                              couponErrors.code ? "border-red-500 focus-visible:ring-red-500" : ""
                            } ${coupon?.isValid ? "border-green-500" : ""}`}
                            disabled={isBooking || !!coupon?.isValid}
                            {...register("code")}
                          />
                          {couponErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{couponErrors.code.message}</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="btn btn-outline py-2 px-4"
                          disabled={isBooking || !!coupon?.isValid}
                        >
                          Apply
                        </button>
                      </form>

                      {/* Coupon status message */}
                      {coupon && (
                        <div
                          className={`mt-2 p-2 text-sm rounded ${
                            coupon.isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {coupon.message}
                        </div>
                      )}
                    </div>

                    {/* Price summary */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between mb-2 text-green-600">
                          <span>Discount ({coupon?.discountPercentage}%):</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-lg mt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div className="mb-6">
                      <h3 className="text-gray-700 font-medium mb-2">Payment Method</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className={`p-3 border rounded-lg flex items-center justify-center ${
                            paymentMethod === "credit-card"
                              ? "border-primary-600 bg-primary-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          onClick={() => setPaymentMethod("credit-card")}
                          disabled={isBooking}
                        >
                          <span className="mr-2">💳</span> Credit Card
                        </button>
                        <button
                          type="button"
                          className={`p-3 border rounded-lg flex items-center justify-center ${
                            paymentMethod === "paypal"
                              ? "border-primary-600 bg-primary-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          onClick={() => setPaymentMethod("paypal")}
                          disabled={isBooking}
                        >
                          <span className="mr-2">🅿️</span> PayPal
                        </button>
                      </div>
                    </div>

                    {/* Confirm booking button */}
                    <button
                      type="button"
                      className="btn btn-primary w-full py-3"
                      onClick={handleBookSubmit}
                      disabled={selectedSeats.length === 0 || isBooking}
                    >
                      {isBooking ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                          Processing...
                        </span>
                      ) : (
                        `Confirm Booking (${selectedSeats.length} ${selectedSeats.length === 1 ? "seat" : "seats"})`
                      )}
                    </button>

                    {/* Booking success message */}
                    {bookingSuccess && (
                      <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center">
                        Booking successful! Redirecting to confirmation...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
