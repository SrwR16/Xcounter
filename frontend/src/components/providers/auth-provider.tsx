"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; userId?: string }>;
  verify2FA: (userId: string, code: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing auth token
    const token = Cookies.get("token");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/users/me/", {
        headers: {
          Authorization: `Token ${Cookies.get("token")}`,
        },
      });
      setUser(data);
    } catch (error) {
      Cookies.remove("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const { data } = await axios.post(`${apiUrl}/users/login/`, { email, password });

      // Check if 2FA is required
      if (data.requires_2fa) {
        return { requires2FA: true, userId: data.user_id };
      }

      // Regular login flow
      Cookies.set("token", data.token, { expires: 7 });
      await fetchUser();
      router.push("/");
      return { requires2FA: false };
    } catch (error) {
      throw new Error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (userId: string, code: string) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const { data } = await axios.post(`${apiUrl}/users/verify-2fa/`, {
        user_id: userId,
        code,
      });

      Cookies.set("token", data.token, { expires: 7 });
      await fetchUser();
      router.push("/dashboard");
    } catch (error) {
      throw new Error("Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    router.push("/login");
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      await axios.post(`${apiUrl}/users/register/`, {
        name,
        email,
        password,
        password_confirm: password,
      });
      // Do NOT log in immediately
      // Instead, show a message to the user (see below)
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      throw new Error(
        error.response?.data?.email?.[0] === "user with this email already exists."
          ? "This email may already be in use."
          : "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verify2FA, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
