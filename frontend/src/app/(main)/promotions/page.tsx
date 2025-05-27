"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// API types
interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  usage_limit: number;
  times_used: number;
  applicable_tier: string;
}

interface CustomerProfile {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  tier: string;
  points: number;
  lifetime_spending: number;
  free_tickets_remaining: number;
  free_tickets_reset_date: string | null;
}

interface TierBenefit {
  id: number;
  tier: string;
  name: string;
  description: string;
  min_spending: number;
  discount_percentage: number;
  free_tickets_per_month: number;
  points_multiplier: number;
}

export default function PromotionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"coupons" | "loyalty" | "benefits">("coupons");

  // Fetch available coupons
  const { data: coupons, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/coupons/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch coupons");
      const data = await response.json();
      return data.results || data;
    },
    enabled: !!user,
  });

  // Fetch customer profile
  const { data: customerProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["customer-profile"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/promotions/customers/me/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customer profile");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch tier benefits
  const { data: tierBenefits, isLoading: isLoadingBenefits } = useQuery({
    queryKey: ["tier-benefits"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/promotions/tier-benefits/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tier benefits");
      const data = await response.json();
      return data.results || data;
    },
    enabled: !!user,
  });

  // Fetch points history
  const { data: pointsHistory } = useQuery({
    queryKey: ["points-history"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/promotions/customers/my_points_history/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch points history");
      return response.json();
    },
    enabled: !!user && activeTab === "loyalty",
  });

  // Filter coupons that are applicable to user's tier
  const getApplicableCoupons = () => {
    if (!coupons || !customerProfile) return [];

    const tierOrder = { basic: 0, silver: 1, gold: 2, vip: 3 };
    const userTierLevel = tierOrder[customerProfile.tier as keyof typeof tierOrder] || 0;

    return coupons.filter((coupon: Coupon) => {
      const couponTierLevel = tierOrder[coupon.applicable_tier as keyof typeof tierOrder] || 0;
      return coupon.is_active && userTierLevel >= couponTierLevel;
    });
  };

  // Get next tier information
  const getNextTierInfo = () => {
    if (!tierBenefits || !customerProfile) return null;

    const sortedTiers = tierBenefits.sort((a: TierBenefit, b: TierBenefit) => a.min_spending - b.min_spending);
    const currentTierIndex = sortedTiers.findIndex((tier: TierBenefit) => tier.tier === customerProfile.tier);

    if (currentTierIndex < sortedTiers.length - 1) {
      const nextTier = sortedTiers[currentTierIndex + 1];
      const pointsNeeded = nextTier.min_spending - customerProfile.lifetime_spending;
      return {
        name: nextTier.tier,
        pointsNeeded: Math.max(0, pointsNeeded),
        progress: (customerProfile.lifetime_spending / nextTier.min_spending) * 100,
      };
    }

    return null;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get tier badge color
  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "basic":
        return "bg-gray-100 text-gray-800";
      case "silver":
        return "bg-gray-300 text-gray-800";
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "vip":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If not authenticated, redirect to login
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  const applicableCoupons = getApplicableCoupons();
  const nextTierInfo = getNextTierInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Promotions & Rewards
              </h1>
              <p className="mt-1 text-sm text-gray-500">Manage your coupons, loyalty points, and membership benefits</p>
            </div>
          </div>

          {/* Membership Status Card */}
          {customerProfile && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg mb-8 p-6 text-white">
              <div className="md:flex md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {customerProfile.tier.charAt(0).toUpperCase() + customerProfile.tier.slice(1)} Member
                  </h2>
                  <p className="text-primary-100">
                    {customerProfile.user.first_name} {customerProfile.user.last_name}
                  </p>
                  <p className="text-primary-100">Lifetime Spending: ${customerProfile.lifetime_spending}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center">
                    <div className="mr-4">
                      <span className="block text-sm text-primary-100">Current Points</span>
                      <span className="text-2xl font-bold">{customerProfile.points}</span>
                    </div>
                    {customerProfile.free_tickets_remaining > 0 && (
                      <div className="mr-4">
                        <span className="block text-sm text-primary-100">Free Tickets</span>
                        <span className="text-2xl font-bold">{customerProfile.free_tickets_remaining}</span>
                      </div>
                    )}
                    {nextTierInfo && (
                      <div>
                        <span className="block text-sm text-primary-100">Next Tier</span>
                        <span className="text-lg font-medium">{nextTierInfo.name.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  {nextTierInfo && (
                    <div className="mt-2">
                      <div className="relative pt-1">
                        <span className="text-xs text-primary-100">${nextTierInfo.pointsNeeded} more to next tier</span>
                        <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-primary-300">
                          <div
                            style={{ width: `${Math.min(nextTierInfo.progress, 100)}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("coupons")}
                  className={`${
                    activeTab === "coupons"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Available Coupons
                </button>
                <button
                  onClick={() => setActiveTab("loyalty")}
                  className={`${
                    activeTab === "loyalty"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Loyalty Points
                </button>
                <button
                  onClick={() => setActiveTab("benefits")}
                  className={`${
                    activeTab === "benefits"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Tier Benefits
                </button>
              </nav>
            </div>

            {/* Coupons Tab */}
            {activeTab === "coupons" && (
              <>
                {isLoadingCoupons ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : applicableCoupons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {applicableCoupons.map((coupon: Coupon) => (
                      <div
                        key={coupon.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col"
                      >
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{coupon.description}</h3>
                            <span
                              className={`ml-2 px-2 py-1 text-xs font-semibold rounded-md ${getTierBadgeColor(
                                coupon.applicable_tier
                              )}`}
                            >
                              {coupon.applicable_tier.charAt(0).toUpperCase() + coupon.applicable_tier.slice(1)}
                            </span>
                          </div>

                          <div className="mb-4">
                            <span className="text-2xl font-bold text-green-600">
                              {coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `$${coupon.discount_value} OFF`}
                            </span>
                            {coupon.min_purchase > 0 && (
                              <p className="text-sm text-gray-500 mt-1">Min. purchase: ${coupon.min_purchase}</p>
                            )}
                          </div>

                          <div className="mt-2 mb-4">
                            <span className="text-sm text-gray-500">
                              Valid: {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}
                            </span>
                          </div>

                          <div className="mt-2 mb-4">
                            <span className="text-xs text-gray-500">
                              Used: {coupon.times_used} / {coupon.usage_limit || "Unlimited"}
                            </span>
                          </div>

                          <div className="bg-gray-100 rounded-md p-3 text-center">
                            <span className="text-sm font-medium text-gray-700">Promo Code:</span>
                            <div className="mt-1 font-mono text-lg font-bold tracking-wider text-gray-900">
                              {coupon.code}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-gray-200">
                          <Link
                            href="/movies"
                            className="block w-full bg-primary-600 text-white rounded-md py-2 text-sm font-medium text-center hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Use This Coupon
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No coupons available for your tier at the moment.</p>
                  </div>
                )}
              </>
            )}

            {/* Loyalty Points Tab */}
            {activeTab === "loyalty" && (
              <div className="p-6">
                {isLoadingProfile ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Current Points</h3>
                        <p className="text-3xl font-bold">{customerProfile?.points || 0}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Lifetime Spending</h3>
                        <p className="text-3xl font-bold">${customerProfile?.lifetime_spending || 0}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Free Tickets</h3>
                        <p className="text-3xl font-bold">{customerProfile?.free_tickets_remaining || 0}</p>
                      </div>
                    </div>

                    {pointsHistory && pointsHistory.results && pointsHistory.results.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Points Activity</h3>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="divide-y divide-gray-200">
                            {pointsHistory.results.slice(0, 10).map((transaction: any) => (
                              <div key={transaction.id} className="p-4 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {transaction.transaction_type === "earning" ? "Earned" : "Spent"} Points
                                  </p>
                                  <p className="text-sm text-gray-500">{transaction.reference}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(transaction.transaction_date).toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`text-lg font-semibold ${
                                      transaction.transaction_type === "earning" ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {transaction.transaction_type === "earning" ? "+" : "-"}
                                    {Math.abs(transaction.points)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tier Benefits Tab */}
            {activeTab === "benefits" && (
              <div className="p-6">
                {isLoadingBenefits ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : tierBenefits && tierBenefits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tierBenefits.map((benefit: TierBenefit) => (
                      <div
                        key={benefit.id}
                        className={`border-2 rounded-lg p-6 ${
                          customerProfile?.tier === benefit.tier
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
                              benefit.tier
                            )}`}
                          >
                            {benefit.tier.charAt(0).toUpperCase() + benefit.tier.slice(1)}
                          </span>
                          {customerProfile?.tier === benefit.tier && (
                            <span className="ml-2 inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-4 text-center">{benefit.name}</h3>
                        <p className="text-sm text-gray-600 mt-2 text-center">{benefit.description}</p>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Min. Spending:</span>
                            <span className="font-medium">${benefit.min_spending}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium">{benefit.discount_percentage}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Free Tickets/Month:</span>
                            <span className="font-medium">{benefit.free_tickets_per_month}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Points Multiplier:</span>
                            <span className="font-medium">{benefit.points_multiplier}x</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500">No tier benefits information available.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How to Earn More */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">How to Earn More Rewards</h3>
              <p className="mt-1 text-sm text-gray-500">Discover ways to unlock special offers and advance your tier</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Book More Movies</h4>
                  <p className="text-sm text-gray-500">
                    Each booking earns you points and increases your lifetime spending towards the next tier.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Leave Reviews</h4>
                  <p className="text-sm text-gray-500">
                    Share your movie experience and earn bonus points for detailed reviews.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Reach Higher Tiers</h4>
                  <p className="text-sm text-gray-500">
                    Unlock better discounts, more free tickets, and exclusive promotions with higher membership tiers.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/movies"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Start Booking Movies
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
