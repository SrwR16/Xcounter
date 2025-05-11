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

// Notification preferences type
interface NotificationPreferences {
  email: {
    promotions: boolean;
    upcomingEvents: boolean;
    accountUpdates: boolean;
    reservationConfirmations: boolean;
    reservationReminders: boolean;
    newsletterUpdates: boolean;
  };
  sms: {
    promotions: boolean;
    upcomingEvents: boolean;
    reservationConfirmations: boolean;
    reservationReminders: boolean;
  };
  push: {
    promotions: boolean;
    upcomingEvents: boolean;
    accountUpdates: boolean;
    reservationConfirmations: boolean;
    reservationReminders: boolean;
  };
}

// Form schema
const notificationPreferencesSchema = z.object({
  email: z.object({
    promotions: z.boolean(),
    upcomingEvents: z.boolean(),
    accountUpdates: z.boolean(),
    reservationConfirmations: z.boolean(),
    reservationReminders: z.boolean(),
    newsletterUpdates: z.boolean(),
  }),
  sms: z.object({
    promotions: z.boolean(),
    upcomingEvents: z.boolean(),
    reservationConfirmations: z.boolean(),
    reservationReminders: z.boolean(),
  }),
  push: z.object({
    promotions: z.boolean(),
    upcomingEvents: z.boolean(),
    accountUpdates: z.boolean(),
    reservationConfirmations: z.boolean(),
    reservationReminders: z.boolean(),
  }),
});

type NotificationPreferencesFormValues = z.infer<typeof notificationPreferencesSchema>;

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotificationPreferencesFormValues>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      email: {
        promotions: true,
        upcomingEvents: true,
        accountUpdates: true,
        reservationConfirmations: true,
        reservationReminders: true,
        newsletterUpdates: false,
      },
      sms: {
        promotions: false,
        upcomingEvents: true,
        reservationConfirmations: true,
        reservationReminders: true,
      },
      push: {
        promotions: true,
        upcomingEvents: true,
        accountUpdates: true,
        reservationConfirmations: true,
        reservationReminders: true,
      },
    },
  });

  // Fetch notification preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      const mockPreferences: NotificationPreferences = {
        email: {
          promotions: true,
          upcomingEvents: true,
          accountUpdates: true,
          reservationConfirmations: true,
          reservationReminders: true,
          newsletterUpdates: false,
        },
        sms: {
          promotions: false,
          upcomingEvents: true,
          reservationConfirmations: true,
          reservationReminders: true,
        },
        push: {
          promotions: true,
          upcomingEvents: true,
          accountUpdates: true,
          reservationConfirmations: true,
          reservationReminders: true,
        },
      };

      // Reset form with fetched data
      reset(mockPreferences);

      return mockPreferences;
    },
    enabled: !!user,
  });

  // Handle form submission
  const onSubmit = async (data: NotificationPreferencesFormValues) => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setActionSuccess("Notification preferences updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      setActionError("An error occurred while updating your preferences. Please try again.");

      // Clear error message after 3 seconds
      setTimeout(() => {
        setActionError(null);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle all notifications for a channel
  const toggleAllForChannel = (channel: "email" | "sms" | "push", value: boolean) => {
    if (channel === "email") {
      setValue("email.promotions", value);
      setValue("email.upcomingEvents", value);
      setValue("email.accountUpdates", value);
      setValue("email.reservationConfirmations", value);
      setValue("email.reservationReminders", value);
      setValue("email.newsletterUpdates", value);
    } else if (channel === "sms") {
      setValue("sms.promotions", value);
      setValue("sms.upcomingEvents", value);
      setValue("sms.reservationConfirmations", value);
      setValue("sms.reservationReminders", value);
    } else if (channel === "push") {
      setValue("push.promotions", value);
      setValue("push.upcomingEvents", value);
      setValue("push.accountUpdates", value);
      setValue("push.reservationConfirmations", value);
      setValue("push.reservationReminders", value);
    }
  };

  // Toggle all notifications for a type
  const toggleAllForType = (type: string, value: boolean) => {
    if (type === "promotions") {
      setValue("email.promotions", value);
      setValue("sms.promotions", value);
      setValue("push.promotions", value);
    } else if (type === "upcomingEvents") {
      setValue("email.upcomingEvents", value);
      setValue("sms.upcomingEvents", value);
      setValue("push.upcomingEvents", value);
    } else if (type === "accountUpdates") {
      setValue("email.accountUpdates", value);
      setValue("push.accountUpdates", value);
    } else if (type === "reservationConfirmations") {
      setValue("email.reservationConfirmations", value);
      setValue("sms.reservationConfirmations", value);
      setValue("push.reservationConfirmations", value);
    } else if (type === "reservationReminders") {
      setValue("email.reservationReminders", value);
      setValue("sms.reservationReminders", value);
      setValue("push.reservationReminders", value);
    }
  };

  // Check if all notifications for a channel are enabled
  const areAllEnabledForChannel = (channel: "email" | "sms" | "push") => {
    const formValues = watch();

    if (channel === "email") {
      return (
        formValues.email.promotions &&
        formValues.email.upcomingEvents &&
        formValues.email.accountUpdates &&
        formValues.email.reservationConfirmations &&
        formValues.email.reservationReminders &&
        formValues.email.newsletterUpdates
      );
    } else if (channel === "sms") {
      return (
        formValues.sms.promotions &&
        formValues.sms.upcomingEvents &&
        formValues.sms.reservationConfirmations &&
        formValues.sms.reservationReminders
      );
    } else if (channel === "push") {
      return (
        formValues.push.promotions &&
        formValues.push.upcomingEvents &&
        formValues.push.accountUpdates &&
        formValues.push.reservationConfirmations &&
        formValues.push.reservationReminders
      );
    }

    return false;
  };

  // If not authenticated, redirect to login
  if (!authLoading && !user) {
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
                Notification Preferences
              </h1>
              <p className="mt-1 text-sm text-gray-500">Manage how and when you receive notifications</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {actionSuccess && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
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
                  <p className="text-sm text-green-700">{actionSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {actionError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{actionError}</p>
                </div>
              </div>
            </div>
          )}

          {isLoadingPreferences ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Channels</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose how you want to receive notifications</p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="bg-gray-50 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1"></div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-gray-700">Email</span>
                        <button
                          type="button"
                          onClick={() => toggleAllForChannel("email", !areAllEnabledForChannel("email"))}
                          className="block mx-auto mt-1 text-xs text-primary-600 hover:text-primary-900"
                        >
                          {areAllEnabledForChannel("email") ? "Disable all" : "Enable all"}
                        </button>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-gray-700">SMS</span>
                        <button
                          type="button"
                          onClick={() => toggleAllForChannel("sms", !areAllEnabledForChannel("sms"))}
                          className="block mx-auto mt-1 text-xs text-primary-600 hover:text-primary-900"
                        >
                          {areAllEnabledForChannel("sms") ? "Disable all" : "Enable all"}
                        </button>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-gray-700">Push</span>
                        <button
                          type="button"
                          onClick={() => toggleAllForChannel("push", !areAllEnabledForChannel("push"))}
                          className="block mx-auto mt-1 text-xs text-primary-600 hover:text-primary-900"
                        >
                          {areAllEnabledForChannel("push") ? "Disable all" : "Enable all"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200">
                  <dl>
                    {/* Promotions */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <span>Promotions & Offers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const formValues = watch();
                            const allEnabled =
                              formValues.email.promotions && formValues.sms.promotions && formValues.push.promotions;
                            toggleAllForType("promotions", !allEnabled);
                          }}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                        >
                          Toggle all
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-promotions"
                          {...register("email.promotions")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="sms-promotions"
                          {...register("sms.promotions")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="push-promotions"
                          {...register("push.promotions")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <span>Upcoming Events</span>
                        <button
                          type="button"
                          onClick={() => {
                            const formValues = watch();
                            const allEnabled =
                              formValues.email.upcomingEvents &&
                              formValues.sms.upcomingEvents &&
                              formValues.push.upcomingEvents;
                            toggleAllForType("upcomingEvents", !allEnabled);
                          }}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                        >
                          Toggle all
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-upcomingEvents"
                          {...register("email.upcomingEvents")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="sms-upcomingEvents"
                          {...register("sms.upcomingEvents")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="push-upcomingEvents"
                          {...register("push.upcomingEvents")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                    </div>

                    {/* Account Updates */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <span>Account Updates</span>
                        <button
                          type="button"
                          onClick={() => {
                            const formValues = watch();
                            const allEnabled = formValues.email.accountUpdates && formValues.push.accountUpdates;
                            toggleAllForType("accountUpdates", !allEnabled);
                          }}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                        >
                          Toggle all
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-accountUpdates"
                          {...register("email.accountUpdates")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <span className="text-gray-400 text-xs">Not Available</span>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="push-accountUpdates"
                          {...register("push.accountUpdates")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                    </div>

                    {/* Reservation Confirmations */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <span>Reservation Confirmations</span>
                        <button
                          type="button"
                          onClick={() => {
                            const formValues = watch();
                            const allEnabled =
                              formValues.email.reservationConfirmations &&
                              formValues.sms.reservationConfirmations &&
                              formValues.push.reservationConfirmations;
                            toggleAllForType("reservationConfirmations", !allEnabled);
                          }}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                        >
                          Toggle all
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-reservationConfirmations"
                          {...register("email.reservationConfirmations")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="sms-reservationConfirmations"
                          {...register("sms.reservationConfirmations")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="push-reservationConfirmations"
                          {...register("push.reservationConfirmations")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                    </div>

                    {/* Reservation Reminders */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 border-b border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <span>Reservation Reminders</span>
                        <button
                          type="button"
                          onClick={() => {
                            const formValues = watch();
                            const allEnabled =
                              formValues.email.reservationReminders &&
                              formValues.sms.reservationReminders &&
                              formValues.push.reservationReminders;
                            toggleAllForType("reservationReminders", !allEnabled);
                          }}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                        >
                          Toggle all
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-reservationReminders"
                          {...register("email.reservationReminders")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="sms-reservationReminders"
                          {...register("sms.reservationReminders")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="push-reservationReminders"
                          {...register("push.reservationReminders")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                    </div>

                    {/* Newsletter Updates */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Newsletter Updates</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <input
                          type="checkbox"
                          id="email-newsletterUpdates"
                          {...register("email.newsletterUpdates")}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <span className="text-gray-400 text-xs">Not Available</span>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex justify-center items-center">
                        <span className="text-gray-400 text-xs">Not Available</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-white shadow sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Communication Frequency</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Choose how often you want to receive marketing communications.</p>
                  </div>
                  <div className="mt-5">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="frequency-weekly"
                          name="notification-frequency"
                          type="radio"
                          defaultChecked
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="frequency-weekly" className="ml-3 block text-sm font-medium text-gray-700">
                          Weekly (recommended)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="frequency-biweekly"
                          name="notification-frequency"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="frequency-biweekly" className="ml-3 block text-sm font-medium text-gray-700">
                          Biweekly
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="frequency-monthly"
                          name="notification-frequency"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="frequency-monthly" className="ml-3 block text-sm font-medium text-gray-700">
                          Monthly
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isSaving ? (
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
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
