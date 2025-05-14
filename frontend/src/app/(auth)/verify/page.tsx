"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const verificationSchema = z.object({
  code: z.string().min(4, "Verification code is required").max(10),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

// Define role types for better type safety
type UserRole = "ADMIN" | "MODERATOR" | "SALESMAN" | "CUSTOMER";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verify2FA, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  // If no userId or email is provided, or user is already logged in, redirect
  useEffect(() => {
    if (user) {
      const rolePaths: Record<UserRole, string> = {
        ADMIN: "/admin/dashboard",
        MODERATOR: "/dashboard",
        SALESMAN: "/salesman/dashboard",
        CUSTOMER: "/account",
      };
      // Use type assertion for better type safety
      const role = user.role as UserRole;
      const redirectPath = rolePaths[role] || "/";
      router.push(redirectPath);
    } else if (!userId || !email) {
      router.push("/login");
    }
  }, [user, userId, email, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerificationFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!userId) {
        setError("Missing user information. Please try again.");
        return;
      }

      // Verify 2FA code
      await verify2FA(userId, data.code);

      // Show success message (this will be briefly shown before redirecting)
      setSuccess("Verification successful! Redirecting to your dashboard...");
    } catch (error) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId || !email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold text-2xl">
            X
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-display font-bold text-gray-900">Verification Required</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please enter the verification code sent to your email address
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 text-sm">{error}</div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 rounded-md p-4 text-sm">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input type="email" value={email || ""} disabled className="input bg-gray-50" />
              </div>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="code"
                  type="text"
                  autoComplete="one-time-code"
                  className={`input ${errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("code")}
                  disabled={isLoading}
                  autoFocus
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary w-full py-2 px-4" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Return to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
