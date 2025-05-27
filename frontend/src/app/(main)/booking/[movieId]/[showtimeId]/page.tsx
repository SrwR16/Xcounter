"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useCreateBooking, useMovie, useShow, useValidateCoupon } from "@/hooks/api";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

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
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // API Hooks
  const { data: movie, isLoading: isLoadingMovie, error: movieError } = useMovie(parseInt(params.movieId));
  const { data: show, isLoading: isLoadingShow, error: showError } = useShow(parseInt(params.showtimeId));
  const createBookingMutation = useCreateBooking();
  const validateCouponMutation = useValidateCoupon();

  // Form for coupon validation
  const {
    register,
    handleSubmit,
    formState: { errors: couponErrors },
    reset,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
  });

  // Generate seats based on theater capacity
  const generateSeats = (capacity: number): Seat[] => {
    const seats: Seat[] = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const seatsPerRow = Math.ceil(capacity / rows.length);

    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        if (seats.length >= capacity) break;

        let type: "standard" | "premium" | "vip" = "standard";
        let basePrice = show?.price || 12.99;

        // Premium seats in middle rows
        if (rowIndex >= 3 && rowIndex <= 6 && i >= 4 && i <= seatsPerRow - 3) {
          type = "premium";
          basePrice = basePrice * 1.2;
        }
        // VIP seats in back middle
        else if (rowIndex >= 7 && i >= 4 && i <= seatsPerRow - 3) {
          type = "vip";
          basePrice = basePrice * 1.5;
        }

        // Randomly mark some seats as booked (about 20%)
        const status = Math.random() < 0.2 ? "booked" : "available";

        seats.push({
          id: `${row}-${i}`,
          row,
          number: i,
          type,
          price: parseFloat(basePrice.toFixed(2)),
          status,
        });
      }
    });

    return seats;
  };

  const seats = show ? generateSeats(show.theater.capacity) : [];

  // Validate coupon code
  const onSubmitCoupon = async (data: CouponFormData) => {
    try {
      const response = await validateCouponMutation.mutateAsync(data.code);

      if (response.is_valid) {
        setCoupon({
          code: data.code.toUpperCase(),
          discountPercentage: response.discount_percentage,
          isValid: true,
          message: `${response.discount_percentage}% discount applied!`,
        });
        toast.success("Coupon applied successfully!");
      } else {
        setCoupon({
          code: data.code.toUpperCase(),
          discountPercentage: 0,
          isValid: false,
          message: response.message || "Invalid or expired coupon code.",
        });
        toast.error("Invalid coupon code");

        // Reset form after 3 seconds
        setTimeout(() => {
          reset();
          setCoupon(null);
        }, 3000);
      }
    } catch (error) {
      toast.error("Failed to validate coupon");
      setCoupon({
        code: data.code.toUpperCase(),
        discountPercentage: 0,
        isValid: false,
        message: "Failed to validate coupon code.",
      });
    }
  };

  // Handle seat selection
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "booked") return;

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);

      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, { ...seat, status: "selected" }];
      }
    });
  };

  // Calculate prices
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
      const seatNumbers = selectedSeats.map((seat) =>
        parseInt(`${seat.row.charCodeAt(0) - 64}${seat.number.toString().padStart(2, "0")}`)
      );

      const bookingData = {
        show: parseInt(params.showtimeId),
        seats: seatNumbers,
        coupon_code: coupon?.isValid ? coupon.code : undefined,
      };

      const result = await createBookingMutation.mutateAsync(bookingData);

      setBookingSuccess(true);
      toast.success("Booking successful!");

      // Redirect to confirmation page
      setTimeout(() => {
        router.push(`/booking/confirmation/${params.movieId}/${result.id}`);
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Booking failed. Please try again.");
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoadingMovie) {
      router.push(`/login?redirect=/booking/${params.movieId}/${params.showtimeId}`);
    }
  }, [user, isLoadingMovie, router, params.movieId, params.showtimeId]);

  if (isLoadingMovie || isLoadingShow) {
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

  if (movieError || showError || !movie || !show) {
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
                <Image
                  src={movie.poster || `https://picsum.photos/seed/movie-${movie.id}/300/450`}
                  alt={movie.title}
                  width={100}
                  height={150}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{movie.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-700 gap-2 sm:gap-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(show.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{show.time}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                    <span>{show.theater.name}</span>
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

                {/* Seat legend */}
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
                    <span className="text-sm text-gray-700">Premium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 border-2 border-purple-500 rounded-md mr-2"></div>
                    <span className="text-sm text-gray-700">VIP</span>
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
                    {Array.from(new Set(seats.map((seat: Seat) => seat.row))).map((row: string) => (
                      <div key={row} className="flex justify-center mb-2">
                        <div className="w-6 text-center text-gray-700 mr-2">{row}</div>
                        <div className="flex gap-1">
                          {seats
                            .filter((seat: Seat) => seat.row === row)
                            .sort((a: Seat, b: Seat) => a.number - b.number)
                            .map((seat: Seat) => {
                              const isSelected = selectedSeats.some((s) => s.id === seat.id);

                              let seatClass =
                                "w-8 h-8 flex items-center justify-center text-xs rounded-t-md cursor-pointer transition-colors";

                              if (seat.status === "booked") {
                                seatClass += " bg-gray-400 cursor-not-allowed";
                              } else if (isSelected) {
                                seatClass += " bg-primary-500 text-white";
                              } else {
                                seatClass += " bg-gray-200 hover:bg-gray-300";
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
                                  disabled={seat.status === "booked" || createBookingMutation.isPending}
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
                            className={`input ${couponErrors.code ? "border-red-500" : ""} ${coupon?.isValid ? "border-green-500" : ""}`}
                            disabled={createBookingMutation.isPending || !!coupon?.isValid}
                            {...register("code")}
                          />
                          {couponErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{couponErrors.code.message}</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="btn btn-outline py-2 px-4"
                          disabled={
                            createBookingMutation.isPending || !!coupon?.isValid || validateCouponMutation.isPending
                          }
                        >
                          {validateCouponMutation.isPending ? "..." : "Apply"}
                        </button>
                      </form>

                      {coupon && (
                        <div
                          className={`mt-2 p-2 text-sm rounded ${coupon.isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
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
                          disabled={createBookingMutation.isPending}
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
                          disabled={createBookingMutation.isPending}
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
                      disabled={selectedSeats.length === 0 || createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? (
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
