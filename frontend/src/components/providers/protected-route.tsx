"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Define user role type for better type safety
type UserRole = "ADMIN" | "MODERATOR" | "SALESMAN" | "CUSTOMER";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication and authorization
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // If roles are specified, check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
        // Redirect based on role
        switch (user.role) {
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "MODERATOR":
            router.push("/dashboard");
            break;
          case "SALESMAN":
            router.push("/salesman/dashboard");
            break;
          case "CUSTOMER":
            router.push("/account");
            break;
          default:
            router.push("/");
            break;
        }
        return;
      }

      // User is authenticated and authorized
      setAuthorized(true);
    }
  }, [user, isLoading, router, allowedRoles]);

  // Show loading state while checking authorization
  if (isLoading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
}
