"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Get role-specific dashboard link
  const getDashboardLink = () => {
    if (!user) return "/login";

    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "MODERATOR":
        return "/dashboard";
      case "SALESMAN":
        return "/salesman/dashboard";
      case "CUSTOMER":
        return "/account";
      default:
        return "/account";
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold text-lg">
                X
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">XCounter</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/") ? "text-primary-600" : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Home
            </Link>
            <Link
              href="/movies"
              className={`text-sm font-medium transition-colors ${
                isActive("/movies") ? "text-primary-600" : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Movies
            </Link>
            <Link
              href="/promotions"
              className={`text-sm font-medium transition-colors ${
                isActive("/promotions") ? "text-primary-600" : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Promotions
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors ${
                isActive("/contact") ? "text-primary-600" : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Contact
            </Link>

            {/* User is logged in */}
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none">
                  <span>{user.name}</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={getDashboardLink()}
                          className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                        >
                          {user.role === "CUSTOMER" ? "My Account" : "Dashboard"}
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/account/bookings"
                          className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                        >
                          My Bookings
                        </Link>
                      )}
                    </Menu.Item>

                    {/* Admin links */}
                    {user.role === "ADMIN" && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/movies"
                              className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                            >
                              Manage Movies
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/employee-management"
                              className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                            >
                              Manage Employees
                            </Link>
                          )}
                        </Menu.Item>
                      </>
                    )}

                    {/* Moderator links */}
                    {(user.role === "MODERATOR" || user.role === "ADMIN") && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/promotions"
                              className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                            >
                              Manage Promotions
                            </Link>
                          )}
                        </Menu.Item>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? "bg-gray-100" : ""
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <Link href="/login" className="btn btn-primary py-2 px-4 rounded text-white shadow-sm">
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? "hidden" : "block"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? "block" : "hidden"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/") ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-primary-600"
            }`}
          >
            Home
          </Link>
          <Link
            href="/movies"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/movies") ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-primary-600"
            }`}
          >
            Movies
          </Link>
          <Link
            href="/promotions"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/promotions") ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-primary-600"
            }`}
          >
            Promotions
          </Link>
          <Link
            href="/contact"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/contact") ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-primary-600"
            }`}
          >
            Contact
          </Link>

          {/* User options in mobile menu */}
          {user ? (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="px-3 py-2">
                <div className="font-medium text-gray-800">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <Link
                href={getDashboardLink()}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              >
                {user.role === "CUSTOMER" ? "My Account" : "Dashboard"}
              </Link>
              <Link
                href="/account/bookings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              >
                My Bookings
              </Link>

              {/* Admin links for mobile */}
              {user.role === "ADMIN" && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/admin/movies"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    Manage Movies
                  </Link>
                  <Link
                    href="/admin/employee-management"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    Manage Employees
                  </Link>
                </>
              )}

              {/* Logout button */}
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={logout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
