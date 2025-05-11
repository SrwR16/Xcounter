"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

// Coupon form schema
const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  discountType: z.enum(["percentage", "fixed"], {
    required_error: "Please select a discount type",
  }),
  discountValue: z.coerce.number().positive("Discount value must be positive"),
  minPurchaseAmount: z.coerce.number().min(0, "Minimum purchase amount must be at least 0"),
  maxDiscountAmount: z.coerce
    .number()
    .nullable()
    .refine((val) => val === null || val > 0, "Maximum discount amount must be positive if provided"),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTo: z.string().min(1, "Valid to date is required"),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().int().positive("Usage limit must be a positive integer"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function CouponManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
      usageLimit: 1,
      description: "",
    },
  });

  // Watch discount type to conditionally display fields
  const discountType = watch("discountType");

  // Fetch coupons
  const { data: coupons, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      // In a real app, you would fetch from an API
      await new Promise((resolve) => setTimeout(resolve, 800));

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
          currentUsage: 2,
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
          currentUsage: 3,
          description: "Flat $5 off on purchases over $20",
        },
        {
          id: "c4",
          code: "SUMMER25",
          discountType: "percentage",
          discountValue: 25,
          minPurchaseAmount: 30,
          maxDiscountAmount: 75,
          validFrom: "2025-06-01T00:00:00Z",
          validTo: "2025-08-31T23:59:59Z",
          isActive: false,
          usageLimit: 100,
          currentUsage: 0,
          description: "Summer special: 25% off on purchases over $30",
        },
      ] as Coupon[];
    },
    enabled: !!user && user.email.includes("admin"),
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      // In a real app, you would post to an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        id: `c${Math.floor(Math.random() * 1000)}`,
        ...data,
        currentUsage: 0,
      };
    },
    onSuccess: () => {
      setSuccess("Coupon created successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError("Failed to create coupon. Please try again.");
      console.error(error);
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData & { id: string }) => {
      // In a real app, you would put to an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        ...data,
        currentUsage: selectedCoupon?.currentUsage || 0,
      };
    },
    onSuccess: () => {
      setSuccess("Coupon updated successfully!");
      setIsEditing(false);
      setSelectedCoupon(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError("Failed to update coupon. Please try again.");
      console.error(error);
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      // In a real app, you would delete via an API
      await new Promise((resolve) => setTimeout(resolve, 800));

      return id;
    },
    onSuccess: () => {
      setSuccess("Coupon deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError("Failed to delete coupon. Please try again.");
      console.error(error);
    },
  });

  // Handle form submission
  const onSubmit = async (data: CouponFormData) => {
    setError(null);

    try {
      if (isEditing && selectedCoupon) {
        await updateCouponMutation.mutateAsync({ ...data, id: selectedCoupon.id });
      } else {
        await createCouponMutation.mutateAsync(data);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    }
  };

  // Handle edit coupon
  const handleEditCoupon = (coupon: Coupon) => {
    setIsEditing(true);
    setSelectedCoupon(coupon);

    // Format dates for form input (YYYY-MM-DD)
    const validFrom = new Date(coupon.validFrom).toISOString().split("T")[0];
    const validTo = new Date(coupon.validTo).toISOString().split("T")[0];

    // Set form values
    setValue("code", coupon.code);
    setValue("discountType", coupon.discountType);
    setValue("discountValue", coupon.discountValue);
    setValue("minPurchaseAmount", coupon.minPurchaseAmount);
    setValue("maxDiscountAmount", coupon.maxDiscountAmount);
    setValue("validFrom", validFrom);
    setValue("validTo", validTo);
    setValue("isActive", coupon.isActive);
    setValue("usageLimit", coupon.usageLimit);
    setValue("description", coupon.description);
  };

  // Handle delete coupon
  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      await deleteCouponMutation.mutateAsync(id);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedCoupon(null);
    reset();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // If not authenticated or not an admin, redirect to login
  if (!authLoading && (!user || !user.email.includes("admin"))) {
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Coupon Management</h1>
              <p className="mt-1 text-sm text-gray-500">Create, edit, and manage discount coupons for your customers</p>
            </div>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coupon Form */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isEditing ? "Edit Coupon" : "Create New Coupon"}
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Coupon Code*
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="code"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.code ? "border-red-300" : ""
                          }`}
                          placeholder="e.g., SUMMER20"
                          {...register("code")}
                        />
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                        Discount Type*
                      </label>
                      <div className="mt-1">
                        <select
                          id="discountType"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.discountType ? "border-red-300" : ""
                          }`}
                          {...register("discountType")}
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                        {errors.discountType && (
                          <p className="mt-1 text-sm text-red-600">{errors.discountType.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                        {discountType === "percentage" ? "Discount Percentage*" : "Discount Amount*"}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        {discountType === "fixed" && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                        )}
                        <input
                          type="number"
                          id="discountValue"
                          step={discountType === "percentage" ? "1" : "0.01"}
                          min="0"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.discountValue ? "border-red-300" : ""
                          } ${discountType === "fixed" ? "pl-7" : ""}`}
                          placeholder={discountType === "percentage" ? "10" : "5.00"}
                          {...register("discountValue")}
                        />
                        {discountType === "percentage" && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        )}
                        {errors.discountValue && (
                          <p className="mt-1 text-sm text-red-600">{errors.discountValue.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700">
                        Minimum Purchase Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="minPurchaseAmount"
                          step="0.01"
                          min="0"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md ${
                            errors.minPurchaseAmount ? "border-red-300" : ""
                          }`}
                          placeholder="0.00"
                          {...register("minPurchaseAmount")}
                        />
                        {errors.minPurchaseAmount && (
                          <p className="mt-1 text-sm text-red-600">{errors.minPurchaseAmount.message}</p>
                        )}
                      </div>
                    </div>

                    {discountType === "percentage" && (
                      <div>
                        <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700">
                          Maximum Discount Amount (optional)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="maxDiscountAmount"
                            step="0.01"
                            min="0"
                            className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md ${
                              errors.maxDiscountAmount ? "border-red-300" : ""
                            }`}
                            placeholder="50.00"
                            {...register("maxDiscountAmount")}
                          />
                          {errors.maxDiscountAmount && (
                            <p className="mt-1 text-sm text-red-600">{errors.maxDiscountAmount.message}</p>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Leave empty for no maximum discount limit</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
                          Valid From*
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            id="validFrom"
                            className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors.validFrom ? "border-red-300" : ""
                            }`}
                            {...register("validFrom")}
                          />
                          {errors.validFrom && <p className="mt-1 text-sm text-red-600">{errors.validFrom.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="validTo" className="block text-sm font-medium text-gray-700">
                          Valid To*
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            id="validTo"
                            className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors.validTo ? "border-red-300" : ""
                            }`}
                            {...register("validTo")}
                          />
                          {errors.validTo && <p className="mt-1 text-sm text-red-600">{errors.validTo.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700">
                        Usage Limit*
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="usageLimit"
                          min="1"
                          step="1"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.usageLimit ? "border-red-300" : ""
                          }`}
                          placeholder="100"
                          {...register("usageLimit")}
                        />
                        {errors.usageLimit && <p className="mt-1 text-sm text-red-600">{errors.usageLimit.message}</p>}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center">
                        <input
                          id="isActive"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          {...register("isActive")}
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                          Active
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Inactive coupons cannot be redeemed even if they are within the valid date range
                      </p>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description*
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          rows={3}
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.description ? "border-red-300" : ""
                          }`}
                          placeholder="Short description of what this coupon is for"
                          {...register("description")}
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {isSubmitting ? (
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
                            {isEditing ? "Updating..." : "Creating..."}
                          </>
                        ) : isEditing ? (
                          "Update Coupon"
                        ) : (
                          "Create Coupon"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Coupons List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Existing Coupons</h3>
                </div>

                {isLoadingCoupons ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : coupons && coupons.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Code
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Discount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Validity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Usage
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
                        {coupons.map((coupon) => (
                          <tr key={coupon.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{coupon.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}%`
                                  : `$${coupon.discountValue.toFixed(2)}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {coupon.minPurchaseAmount > 0 && `Min: $${coupon.minPurchaseAmount.toFixed(2)}`}
                                {coupon.minPurchaseAmount > 0 && coupon.maxDiscountAmount && <span> / </span>}
                                {coupon.maxDiscountAmount && `Max: $${coupon.maxDiscountAmount.toFixed(2)}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(coupon.validFrom)} - {formatDate(coupon.validTo)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {coupon.currentUsage} / {coupon.usageLimit}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ width: `${(coupon.currentUsage / coupon.usageLimit) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {coupon.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditCoupon(coupon)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No coupons found. Create your first coupon!</p>
                  </div>
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
