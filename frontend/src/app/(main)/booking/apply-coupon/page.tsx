"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const couponSchema = z.object({
  couponCode: z.string().min(3, "Coupon code must be at least 3 characters"),
});

type CouponFormData = z.infer<typeof couponSchema>;

// Booking summary type
interface BookingSummary {
  movieTitle: string;
  showtime: string;
  theater: string;
  seats: string[];
  ticketCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

// Coupon type
interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  usageLimit: number;
  currentUsage: number;
  description: string;
}

export default function ApplyCouponPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { user, isLoading: authLoading } = useAuth();
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      couponCode: "",
    },
  });

  // Fetch booking summary
  const { data: bookingSummary, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["booking-summary", bookingId],
    queryFn: async () => {
      // In a real app, you would fetch from an API
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        movieTitle: "Avengers: Endgame",
        showtime: "Today, 7:30 PM",
        theater: "Theater 3",
        seats: ["F5", "F6", "F7"],
        ticketCount: 3,
        subtotal: 45.0,
        discount: appliedCoupon ? calculateDiscount(45.0, appliedCoupon) : 0,
        total: appliedCoupon ? 45.0 - calculateDiscount(45.0, appliedCoupon) : 45.0,
      } as BookingSummary;
    },
    enabled: !!bookingId,
    refetchInterval: 0,
  });

  // Fetch available coupons for the user
  const { data: availableCoupons, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["available-coupons"],
    queryFn: async () => {
      // In a real app, you would fetch from an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return [
        {
          id: "c1",
          code: "WELCOME10",
          discountType: "percentage",
          discountValue: 10,
          minPurchaseAmount: 0,
          maxDiscountAmount: 50,
          validFrom: "2025-01-01T00:00:00Z",
          validTo: "2025-12-31T23:59:59Z",
          isActive: true,
          usageLimit: 1,
          currentUsage: 0,
          description: "10% off for new customers",
        },
        {
          id: "c2",
          code: "MOVIE20",
          discountType: "percentage",
          discountValue: 20,
          minPurchaseAmount: 40,
          maxDiscountAmount: 100,
          validFrom: "2025-01-01T00:00:00Z",
          validTo: "2025-12-31T23:59:59Z",
          isActive: true,
          usageLimit: 5,
          currentUsage: 0,
          description: "20% off on purchases over $40",
        },
        {
          id: "c3",
          code: "FLAT5",
          discountType: "fixed",
          discountValue: 5,
          minPurchaseAmount: 20,
          maxDiscountAmount: null,
          validFrom: "2025-01-01T00:00:00Z",
          validTo: "2025-12-31T23:59:59Z",
          isActive: true,
          usageLimit: 10,
          currentUsage: 0,
          description: "Flat $5 off on purchases over $20",
        },
      ] as Coupon[];
    },
    enabled: !!user,
  });

  // Calculate discount based on coupon type
  function calculateDiscount(amount: number, coupon: Coupon): number {
    if (!coupon) return 0;

    // Check minimum purchase amount
    if (amount < coupon.minPurchaseAmount) return 0;

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = amount * (coupon.discountValue / 100);
      // Apply max discount cap if exists
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    return discount;
  }

  // Handle coupon form submission
  const onSubmit = async (data: CouponFormData) => {
    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real app, you would validate with an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const coupon = availableCoupons?.find((c) => c.code === data.couponCode);

      if (!coupon) {
        setError("Invalid coupon code. Please try again.");
        return;
      }

      if (!coupon.isActive) {
        setError("This coupon is no longer active.");
        return;
      }

      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validTo = new Date(coupon.validTo);

      if (now < validFrom || now > validTo) {
        setError("This coupon is not valid at this time.");
        return;
      }

      if (coupon.usageLimit <= coupon.currentUsage) {
        setError("This coupon has reached its usage limit.");
        return;
      }

      if (bookingSummary && bookingSummary.subtotal < coupon.minPurchaseAmount) {
        setError(`This coupon requires a minimum purchase of $${coupon.minPurchaseAmount.toFixed(2)}.`);
        return;
      }

      // If all checks pass, apply the coupon
      setAppliedCoupon(coupon);
      setSuccess(`Coupon "${coupon.code}" applied successfully!`);
      reset();
    } catch (err) {
      setError("An error occurred while applying the coupon.");
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  // Handle removing an applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setSuccess(null);
    setError(null);
  };

  // Proceed with checkout
  const handleProceedToCheckout = () => {
    // In a real app, you would save the applied coupon to the booking
    const queryParams = new URLSearchParams();
    queryParams.append("bookingId", bookingId || "");

    if (appliedCoupon) {
      queryParams.append("couponId", appliedCoupon.id);
      queryParams.append("discount", calculateDiscount(bookingSummary?.subtotal || 0, appliedCoupon).toString());
    }

    router.push(`/booking/payment?${queryParams.toString()}`);
  };

  // If not authenticated, redirect to login
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  // If no booking ID is provided, redirect to home
  if (!bookingId) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Apply Coupon</h1>
            <p className="mt-1 text-sm text-gray-500">Add a coupon to your booking to get a discount</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Booking Summary */}
            <div className="md:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Summary</h3>
                </div>
                {isLoadingBooking ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : bookingSummary ? (
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Movie</dt>
                        <dd className="mt-1 text-sm text-gray-900">{bookingSummary.movieTitle}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Showtime</dt>
                        <dd className="mt-1 text-sm text-gray-900">{bookingSummary.showtime}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Theater</dt>
                        <dd className="mt-1 text-sm text-gray-900">{bookingSummary.theater}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Seats</dt>
                        <dd className="mt-1 text-sm text-gray-900">{bookingSummary.seats.join(", ")}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Price Breakdown</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="flex justify-between items-center py-1">
                            <span>Subtotal ({bookingSummary.ticketCount} tickets)</span>
                            <span>${bookingSummary.subtotal.toFixed(2)}</span>
                          </div>
                          {appliedCoupon && (
                            <div className="flex justify-between items-center py-1 text-green-600">
                              <div className="flex items-center">
                                <span>Discount ({appliedCoupon.code})</span>
                                <button
                                  onClick={handleRemoveCoupon}
                                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                              <span>-${calculateDiscount(bookingSummary.subtotal, appliedCoupon).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-1 font-bold border-t border-gray-200 mt-2 pt-2">
                            <span>Total</span>
                            <span>
                              $
                              {(
                                bookingSummary.subtotal -
                                (appliedCoupon ? calculateDiscount(bookingSummary.subtotal, appliedCoupon) : 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Booking information not found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Form */}
            <div className="md:col-span-1">
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Apply Coupon</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {success && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!appliedCoupon && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700">
                          Coupon Code
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="couponCode"
                            className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors.couponCode ? "border-red-300" : ""
                            }`}
                            placeholder="Enter coupon code"
                            {...register("couponCode")}
                          />
                          {errors.couponCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.couponCode.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isApplying}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          {isApplying ? (
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
                              Applying...
                            </>
                          ) : (
                            "Apply Coupon"
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Proceed to Checkout
                    </button>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/booking/${bookingId}`}
                      className="text-sm text-primary-600 hover:text-primary-500 block text-center"
                    >
                      Go back to booking
                    </Link>
                  </div>
                </div>
              </div>

              {/* Available Coupons */}
              {isLoadingCoupons ? (
                <div className="mt-6 bg-white shadow sm:rounded-lg p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : availableCoupons && availableCoupons.length > 0 ? (
                <div className="mt-6 bg-white shadow sm:rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Your Available Coupons</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <ul className="divide-y divide-gray-200">
                      {availableCoupons.map((coupon) => (
                        <li key={coupon.id} className="py-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{coupon.code}</p>
                              <p className="text-xs text-gray-500">{coupon.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}% off`
                                  : `$${coupon.discountValue.toFixed(2)} off`}
                                {coupon.minPurchaseAmount > 0 &&
                                  ` on purchases over $${coupon.minPurchaseAmount.toFixed(2)}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onSubmit({ couponCode: coupon.code });
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              disabled={appliedCoupon !== null}
                            >
                              Apply
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-6 bg-white shadow sm:rounded-lg p-6 text-center">
                  <p className="text-gray-500">No coupons available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
