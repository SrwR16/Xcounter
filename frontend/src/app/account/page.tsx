"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membershipLevel: "regular" | "silver" | "gold" | "platinum";
  membershipSince: string;
  ticketsPurchased: number;
  ticketsToNextLevel: number;
  nextLevel: "silver" | "gold" | "platinum" | null;
  discount: number;
  membershipBenefits: string[];
}

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      // Simulate API call to get user profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for demonstration
      return {
        id: "user123",
        name: "John Doe",
        email: user?.email || "john.doe@example.com",
        phone: "555-123-4567",
        membershipLevel: "silver",
        membershipSince: "2023-04-15",
        ticketsPurchased: 120,
        ticketsToNextLevel: 180, // 300 - 120 = 180 more to gold
        nextLevel: "gold",
        discount: 5, // 5% discount for silver
        membershipBenefits: [
          "5% discount on all ticket purchases",
          "Early access to special screenings",
          "Free popcorn on your birthday",
        ],
      } as UserProfile;
    },
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    },
    values: {
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Simulate API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUpdateSuccess(true);
      setIsEditing(false);

      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  // If not authenticated, redirect to login
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  // Show loading state
  if (isLoading || authLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">My Account</h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/account/bookings"
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                View Bookings
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Profile Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              {updateSuccess && (
                <div className="mx-4 my-2 p-2 bg-green-50 text-green-700 text-sm rounded">
                  Profile updated successfully!
                </div>
              )}

              {isEditing ? (
                <div className="border-t border-gray-200">
                  <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                            errors.name ? "border-red-300" : ""
                          }`}
                          {...register("name")}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                            errors.email ? "border-red-300" : ""
                          }`}
                          {...register("email")}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone (optional)
                        </label>
                        <input
                          type="text"
                          id="phone"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          {...register("phone")}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Full name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.name}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Email address</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.email}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {profile?.phone || "Not provided"}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Member since</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(profile?.membershipSince || "").toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            {/* Membership Status */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Membership Status</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your current membership level and benefits</p>
              </div>

              <div className="border-t border-gray-200">
                <div className="p-4 sm:p-6">
                  {/* Membership Card */}
                  <div
                    className={`p-6 rounded-lg shadow-md relative overflow-hidden
                    ${
                      profile?.membershipLevel === "platinum"
                        ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white"
                        : profile?.membershipLevel === "gold"
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                          : profile?.membershipLevel === "silver"
                            ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 rounded-full bg-white opacity-10"></div>

                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold uppercase">{profile?.membershipLevel} Member</h4>
                        <p className="text-sm opacity-80">
                          Member since{" "}
                          {new Date(profile?.membershipSince || "").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold">{profile?.discount}%</span>
                        <p className="text-sm">Discount</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm uppercase tracking-wide opacity-80">Member ID</p>
                      <p className="font-mono text-lg">{profile?.id}</p>
                    </div>
                  </div>

                  {/* Progress to next level */}
                  {profile?.nextLevel && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress to {profile.nextLevel} level</span>
                        <span className="text-sm font-medium text-gray-700">
                          {profile.ticketsPurchased}/{profile.ticketsPurchased + profile.ticketsToNextLevel} tickets
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            profile.membershipLevel === "silver"
                              ? "bg-gray-500"
                              : profile.membershipLevel === "gold"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                          style={{
                            width: `${(profile.ticketsPurchased / (profile.ticketsPurchased + profile.ticketsToNextLevel)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {profile.ticketsToNextLevel} more tickets to reach {profile.nextLevel} level
                      </p>
                    </div>
                  )}

                  {/* Membership Benefits */}
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900">Your Benefits</h4>
                    <ul className="mt-2 space-y-1">
                      {profile?.membershipBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Bookings</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest ticket purchases</p>
                  </div>
                  <Link
                    href="/account/bookings"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all →
                  </Link>
                </div>
                <div className="border-t border-gray-200 p-4 sm:p-6">
                  {/* Mock empty state for demo */}
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent bookings</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by booking tickets for a movie.</p>
                    <div className="mt-6">
                      <Link
                        href="/movies"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Browse Movies
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
