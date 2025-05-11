"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Verification code schema
const verificationSchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only digits"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const onSubmit = async (data: VerificationFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call to verify code
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, any code "123456" is valid
      if (data.code === "123456") {
        // Redirect to dashboard based on role
        // In a real app, this would come from the verification API response
        router.push("/dashboard");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      // Simulate API call to resend verification code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResendSuccess(true);
    } catch (err) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Two-Factor Authentication</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {email ? (
            <>
              A verification code has been sent to <strong>{email}</strong>
            </>
          ) : (
            "Please enter the verification code from your email"
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium leading-6 text-gray-900">
                Verification Code
              </label>
              <div className="mt-2">
                <input
                  id="code"
                  type="text"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.code ? "ring-red-300 focus:ring-red-500" : "ring-gray-300 focus:ring-primary-600"
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-3`}
                  {...register("code")}
                />
                {errors.code && <p className="mt-2 text-sm text-red-600">{errors.code.message}</p>}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="text-sm text-green-700">A new verification code has been sent to your email.</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
              <div className="text-sm">
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Back to Login
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
