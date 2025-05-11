"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Promotion types
interface Promotion {
  id: string;
  code: string;
  type: "discount" | "freebies" | "upgrade";
  description: string;
  discountValue?: number;
  discountType?: "percentage" | "fixed";
  status: "active" | "used" | "expired";
  validFrom: string;
  validUntil: string;
  usedAt?: string;
  restrictions?: string[];
  tier: "basic" | "silver" | "gold" | "vip";
  image?: string;
}

export default function PromotionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "used" | "expired">("available");

  // Fetch user promotions
  const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "PROMO001",
          code: "WELCOME25",
          type: "discount",
          description: "25% off your first booking",
          discountValue: 25,
          discountType: "percentage",
          status: "active",
          validFrom: "2025-01-01",
          validUntil: "2025-12-31",
          restrictions: ["Not valid with other promotions", "First booking only"],
          tier: "basic",
          image: "/images/promotions/welcome.jpg",
        },
        {
          id: "PROMO002",
          code: "MOVIENIGHT",
          type: "freebies",
          description: "Free popcorn with any ticket purchase",
          status: "active",
          validFrom: "2025-03-01",
          validUntil: "2025-04-30",
          restrictions: ["One per customer", "While supplies last"],
          tier: "basic",
          image: "/images/promotions/popcorn.jpg",
        },
        {
          id: "PROMO003",
          code: "UPGRADE10",
          type: "upgrade",
          description: "Upgrade to VIP seating for just $10 more",
          discountValue: 10,
          discountType: "fixed",
          status: "active",
          validFrom: "2025-02-15",
          validUntil: "2025-05-15",
          tier: "silver",
          image: "/images/promotions/vip.jpg",
        },
        {
          id: "PROMO004",
          code: "SUMMER20",
          type: "discount",
          description: "20% off summer blockbusters",
          discountValue: 20,
          discountType: "percentage",
          status: "used",
          validFrom: "2025-06-01",
          validUntil: "2025-08-31",
          usedAt: "2025-06-15T14:30:00Z",
          tier: "basic",
          image: "/images/promotions/summer.jpg",
        },
        {
          id: "PROMO005",
          code: "NYE2025",
          type: "discount",
          description: "Special New Year's Eve discount",
          discountValue: 15,
          discountType: "percentage",
          status: "expired",
          validFrom: "2024-12-25",
          validUntil: "2025-01-02",
          tier: "basic",
          image: "/images/promotions/newyear.jpg",
        },
        {
          id: "PROMO006",
          code: "VIPWEEKEND",
          type: "upgrade",
          description: "Free VIP upgrade for weekend shows",
          status: "expired",
          validFrom: "2025-01-01",
          validUntil: "2025-02-28",
          tier: "gold",
          image: "/images/promotions/weekend.jpg",
        },
        {
          id: "PROMO007",
          code: "BIRTHDAY2025",
          type: "discount",
          description: "Special birthday discount - 50% off",
          discountValue: 50,
          discountType: "percentage",
          status: "active",
          validFrom: "2025-01-01",
          validUntil: "2025-12-31",
          restrictions: ["Valid only on your birthday", "ID verification required"],
          tier: "vip",
          image: "/images/promotions/birthday.jpg",
        },
      ] as Promotion[];
    },
    enabled: !!user,
  });

  // Get user membership tier
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      return {
        name: "John Doe",
        email: user?.email,
        memberSince: "2024-01-15",
        tier: "gold",
        points: 1250,
        nextTier: "vip",
        pointsToNextTier: 750,
      };
    },
    enabled: !!user,
  });

  // Filter promotions based on active tab
  const getFilteredPromotions = () => {
    if (!promotions) return [];

    return promotions.filter((promo) => {
      if (activeTab === "available") {
        return promo.status === "active";
      } else if (activeTab === "used") {
        return promo.status === "used";
      } else {
        return promo.status === "expired";
      }
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "used":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get promotion type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "discount":
        return "bg-purple-100 text-purple-800";
      case "freebies":
        return "bg-yellow-100 text-yellow-800";
      case "upgrade":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const filteredPromotions = getFilteredPromotions();

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Your Promotions</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage your available promotions and special offers</p>
            </div>
          </div>

          {/* Membership Status Card */}
          {userProfile && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg mb-8 p-6 text-white">
              <div className="md:flex md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)} Member
                  </h2>
                  <p className="text-primary-100">Member since {formatDate(userProfile.memberSince)}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center">
                    <div className="mr-4">
                      <span className="block text-sm text-primary-100">Current Points</span>
                      <span className="text-2xl font-bold">{userProfile.points}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-primary-100">Next Tier</span>
                      <span className="text-lg font-medium">{userProfile.nextTier.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="relative pt-1">
                      <span className="text-xs text-primary-100">
                        {userProfile.pointsToNextTier} points to next tier
                      </span>
                      <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-primary-300">
                        <div
                          style={{
                            width: `${(userProfile.points / (userProfile.points + userProfile.pointsToNextTier)) * 100}%`,
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("available")}
                  className={`${
                    activeTab === "available"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Available
                </button>
                <button
                  onClick={() => setActiveTab("used")}
                  className={`${
                    activeTab === "used"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Used
                </button>
                <button
                  onClick={() => setActiveTab("expired")}
                  className={`${
                    activeTab === "expired"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center`}
                >
                  Expired
                </button>
              </nav>
            </div>

            {isLoadingPromotions ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPromotions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredPromotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="h-40 bg-gray-200 relative">
                      {promotion.image ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${promotion.image})` }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                          <svg
                            className="h-12 w-12 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Badge overlays */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-md ${getTypeBadgeColor(promotion.type)}`}
                        >
                          {promotion.type === "discount"
                            ? "Discount"
                            : promotion.type === "freebies"
                              ? "Freebies"
                              : "Upgrade"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-md ${getStatusBadgeColor(promotion.status)}`}
                        >
                          {promotion.status === "active" ? "Active" : promotion.status === "used" ? "Used" : "Expired"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{promotion.description}</h3>
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-md ${getTierBadgeColor(promotion.tier)}`}
                        >
                          {promotion.tier.charAt(0).toUpperCase() + promotion.tier.slice(1)}
                        </span>
                      </div>

                      <div className="mt-2 mb-4">
                        <span className="text-sm text-gray-500">
                          Valid: {formatDate(promotion.validFrom)} - {formatDate(promotion.validUntil)}
                        </span>
                        {promotion.usedAt && (
                          <div className="text-sm text-gray-500 mt-1">
                            Used: {new Date(promotion.usedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {promotion.restrictions && promotion.restrictions.length > 0 && (
                        <div className="mt-2 mb-4">
                          <span className="text-xs text-gray-600 font-medium">Restrictions:</span>
                          <ul className="mt-1 list-disc list-inside text-xs text-gray-500">
                            {promotion.restrictions.map((restriction, index) => (
                              <li key={index}>{restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="bg-gray-100 rounded-md p-3 text-center">
                          <span className="text-sm font-medium text-gray-700">Promo Code:</span>
                          <div className="mt-1 font-mono text-lg font-bold tracking-wider text-gray-900">
                            {promotion.code}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                      {promotion.status === "active" ? (
                        <Link
                          href="/booking/apply-coupon"
                          className="block w-full bg-primary-600 text-white rounded-md py-2 text-sm font-medium text-center hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Use Promotion
                        </Link>
                      ) : promotion.status === "used" ? (
                        <button
                          type="button"
                          className="block w-full bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium text-center cursor-default"
                          disabled
                        >
                          Already Used
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="block w-full bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium text-center cursor-default"
                          disabled
                        >
                          Expired
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                {activeTab === "available" ? (
                  <p className="text-gray-500">You don't have any available promotions at the moment.</p>
                ) : activeTab === "used" ? (
                  <p className="text-gray-500">You haven't used any promotions yet.</p>
                ) : (
                  <p className="text-gray-500">You don't have any expired promotions.</p>
                )}
              </div>
            )}
          </div>

          {/* How to Earn More */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">How to Earn More Promotions</h3>
              <p className="mt-1 text-sm text-gray-500">Discover ways to unlock special offers and rewards</p>
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
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Book More, Save More</h4>
                  <p className="text-sm text-gray-500">
                    Book multiple shows per month to earn loyalty points and unlock exclusive promotions.
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
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Refer Friends</h4>
                  <p className="text-sm text-gray-500">
                    Invite friends to join XCounter and both of you will receive special discount codes.
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
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h4>
                  <p className="text-sm text-gray-500">
                    Add your preferences and complete your profile to receive personalized promotions.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/account"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Membership Benefits
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
