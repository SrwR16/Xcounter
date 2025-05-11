"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Employee interface
interface Employee {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "salesman";
  status: "active" | "inactive" | "suspended";
  hireDate: string;
  salary: number;
  performance: number; // 1-5 rating
  lastReview: string;
}

// Salary history interface
interface SalaryHistory {
  id: string;
  employeeId: string;
  amount: number;
  effectiveDate: string;
  reason: string;
  adjustmentType: "increment" | "penalty" | "initial" | "bonus";
}

// Performance review interface
interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewDate: string;
  rating: number; // 1-5
  feedback: string;
  reviewedBy: string;
}

// Form validation schemas
const salaryAdjustmentSchema = z.object({
  employeeId: z.string().min(1, "Employee selection is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
      message: "Amount must be a non-zero number",
    }),
  adjustmentType: z.enum(["increment", "penalty", "bonus"]),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  effectiveDate: z.string().min(1, "Effective date is required"),
});

const performanceReviewSchema = z.object({
  employeeId: z.string().min(1, "Employee selection is required"),
  rating: z
    .string()
    .min(1, "Rating is required")
    .refine(
      (val) => {
        const rating = Number(val);
        return !isNaN(rating) && rating >= 1 && rating <= 5;
      },
      {
        message: "Rating must be between 1 and 5",
      }
    ),
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  reviewDate: z.string().min(1, "Review date is required"),
});

export default function EmployeesManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "salary" | "performance">("employees");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Salary adjustment form
  const {
    register: registerSalary,
    handleSubmit: handleSalarySubmit,
    formState: { errors: salaryErrors },
    reset: resetSalaryForm,
  } = useForm({
    resolver: zodResolver(salaryAdjustmentSchema),
  });

  // Performance review form
  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    reset: resetReviewForm,
  } = useForm({
    resolver: zodResolver(performanceReviewSchema),
  });

  // Fetch employees
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      return [
        {
          id: "emp1",
          name: "John Smith",
          email: "john.smith@xcounter.com",
          role: "moderator",
          status: "active",
          hireDate: "2023-03-15",
          salary: 3500,
          performance: 4,
          lastReview: "2023-11-10",
        },
        {
          id: "emp2",
          name: "Sarah Johnson",
          email: "sarah.johnson@xcounter.com",
          role: "salesman",
          status: "active",
          hireDate: "2022-06-20",
          salary: 2800,
          performance: 3,
          lastReview: "2023-10-05",
        },
        {
          id: "emp3",
          name: "Michael Davis",
          email: "michael.davis@xcounter.com",
          role: "salesman",
          status: "active",
          hireDate: "2023-01-10",
          salary: 2600,
          performance: 5,
          lastReview: "2023-12-01",
        },
        {
          id: "emp4",
          name: "Emily Wilson",
          email: "emily.wilson@xcounter.com",
          role: "moderator",
          status: "inactive",
          hireDate: "2021-11-05",
          salary: 3300,
          performance: 4,
          lastReview: "2023-09-15",
        },
        {
          id: "emp5",
          name: "David Brown",
          email: "david.brown@xcounter.com",
          role: "salesman",
          status: "suspended",
          hireDate: "2022-09-12",
          salary: 2500,
          performance: 2,
          lastReview: "2023-08-20",
        },
      ];
    },
    enabled: !!user,
  });

  // Fetch salary history for selected employee
  const { data: salaryHistory, isLoading: salaryLoading } = useQuery<SalaryHistory[]>({
    queryKey: ["salaryHistory", selectedEmployee?.id],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Mock data based on selected employee
      return [
        {
          id: "sh1",
          employeeId: selectedEmployee?.id || "",
          amount: selectedEmployee?.role === "moderator" ? 3500 : 2800,
          effectiveDate: "2023-01-01",
          reason: "Annual review adjustment",
          adjustmentType: "increment",
        },
        {
          id: "sh2",
          employeeId: selectedEmployee?.id || "",
          amount: selectedEmployee?.role === "moderator" ? 3300 : 2600,
          effectiveDate: "2022-06-15",
          reason: "Performance bonus",
          adjustmentType: "bonus",
        },
        {
          id: "sh3",
          employeeId: selectedEmployee?.id || "",
          amount: selectedEmployee?.role === "moderator" ? 3200 : 2500,
          effectiveDate: "2022-01-01",
          reason: "Initial salary",
          adjustmentType: "initial",
        },
      ];
    },
    enabled: !!selectedEmployee,
  });

  // Fetch performance reviews for selected employee
  const { data: performanceReviews, isLoading: reviewsLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["performanceReviews", selectedEmployee?.id],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Mock data based on selected employee
      return [
        {
          id: "pr1",
          employeeId: selectedEmployee?.id || "",
          reviewDate: "2023-11-15",
          rating: 4,
          feedback: "Consistently meets expectations and often exceeds them. Excellent customer service skills.",
          reviewedBy: "Admin User",
        },
        {
          id: "pr2",
          employeeId: selectedEmployee?.id || "",
          reviewDate: "2023-05-20",
          rating: 3,
          feedback: "Meets expectations but could improve on timeliness and attention to detail.",
          reviewedBy: "Admin User",
        },
        {
          id: "pr3",
          employeeId: selectedEmployee?.id || "",
          reviewDate: "2022-11-10",
          rating: 4,
          feedback: "Shows initiative and is a good team player. Customer feedback has been positive.",
          reviewedBy: "Former Manager",
        },
      ];
    },
    enabled: !!selectedEmployee,
  });

  // Handle salary adjustment submission
  const onSalaryAdjust = async (data: any) => {
    console.log("Salary adjustment data:", data);
    // In a real app, you would submit this to your API
    // For now, just log and reset the form
    alert("Salary adjustment submitted successfully!");
    setShowSalaryForm(false);
    resetSalaryForm();
  };

  // Handle performance review submission
  const onReviewSubmit = async (data: any) => {
    console.log("Performance review data:", data);
    // In a real app, you would submit this to your API
    // For now, just log and reset the form
    alert("Performance review submitted successfully!");
    setShowReviewForm(false);
    resetReviewForm();
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get performance rating color
  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "text-green-600";
      case 4:
        return "text-teal-600";
      case 3:
        return "text-blue-600";
      case 2:
        return "text-amber-600";
      case 1:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // If not authenticated or not admin/moderator, redirect to login
  if (!authLoading && (!user || (user?.role !== "admin" && user?.role !== "moderator"))) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Employee Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === "admin"
                  ? "Manage employees, track performance, and adjust salaries"
                  : "View employee information and track performance"}
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`${
                  activeTab === "employees"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("employees")}
              >
                Employees
              </button>
              <button
                className={`${
                  activeTab === "salary"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => {
                  if (selectedEmployee) {
                    setActiveTab("salary");
                  } else {
                    alert("Please select an employee first");
                  }
                }}
                disabled={!selectedEmployee}
              >
                Salary History
              </button>
              <button
                className={`${
                  activeTab === "performance"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => {
                  if (selectedEmployee) {
                    setActiveTab("performance");
                  } else {
                    alert("Please select an employee first");
                  }
                }}
                disabled={!selectedEmployee}
              >
                Performance Reviews
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {/* Employees List */}
            {activeTab === "employees" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Employees Directory</h2>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => setIsAddingEmployee(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Add New Employee
                    </button>
                  )}
                </div>

                {/* Employees Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Role
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
                          Salary
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Performance
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Select</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeesLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <div className="animate-pulse flex space-x-4">
                                <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                                <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        employees?.map((employee) => (
                          <tr
                            key={employee.id}
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedEmployee?.id === employee.id ? "bg-blue-50" : ""
                            }`}
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-500">{employee.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">{employee.role}</div>
                              <div className="text-xs text-gray-500">
                                Since {format(new Date(employee.hireDate), "MMM d, yyyy")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  employee.status
                                )}`}
                              >
                                {employee.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${employee.salary.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`font-medium ${getRatingColor(employee.performance)}`}>
                                  {employee.performance}/5
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployee(employee);
                                  setActiveTab("salary");
                                }}
                                className="text-primary-600 hover:text-primary-900 mr-3"
                              >
                                Details
                              </button>
                              {user?.role === "admin" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // In a real app, you'd implement this
                                    alert(`Edit employee: ${employee.name}`);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Salary History */}
            {activeTab === "salary" && selectedEmployee && (
              <div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Salary History - {selectedEmployee.name}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Current salary: ${selectedEmployee.salary.toLocaleString()}
                        </p>
                      </div>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => setShowSalaryForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Add Salary Adjustment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Salary Form */}
                  {showSalaryForm && user?.role === "admin" && (
                    <div className="px-4 py-5 bg-gray-50 sm:p-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">New Salary Adjustment</h4>
                      <form onSubmit={handleSalarySubmit(onSalaryAdjust)} className="space-y-4">
                        <input type="hidden" value={selectedEmployee.id} {...registerSalary("employeeId")} />
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                              Amount ($)
                            </label>
                            <input
                              type="text"
                              id="amount"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="e.g., 300 for increment, -100 for penalty"
                              {...registerSalary("amount")}
                            />
                            {salaryErrors.amount && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.amount.message?.toString()}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="adjustmentType" className="block text-sm font-medium text-gray-700">
                              Adjustment Type
                            </label>
                            <select
                              id="adjustmentType"
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                              {...registerSalary("adjustmentType")}
                            >
                              <option value="increment">Increment</option>
                              <option value="penalty">Penalty</option>
                              <option value="bonus">Bonus</option>
                            </select>
                            {salaryErrors.adjustmentType && (
                              <p className="mt-1 text-sm text-red-600">
                                {salaryErrors.adjustmentType.message?.toString()}
                              </p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                              Effective Date
                            </label>
                            <input
                              type="date"
                              id="effectiveDate"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerSalary("effectiveDate")}
                            />
                            {salaryErrors.effectiveDate && (
                              <p className="mt-1 text-sm text-red-600">
                                {salaryErrors.effectiveDate.message?.toString()}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                              Reason
                            </label>
                            <textarea
                              id="reason"
                              rows={3}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Explain the reason for this adjustment"
                              {...registerSalary("reason")}
                            ></textarea>
                            {salaryErrors.reason && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.reason.message?.toString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowSalaryForm(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Save Adjustment
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {salaryLoading ? (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <div className="animate-pulse flex space-x-4 col-span-3">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : salaryHistory?.length === 0 ? (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <div className="text-sm text-gray-500 col-span-3 text-center">
                            No salary history available
                          </div>
                        </div>
                      ) : (
                        salaryHistory?.map((item) => (
                          <div key={item.id} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              {format(new Date(item.effectiveDate), "MMM d, yyyy")}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex justify-between">
                                <div>
                                  <span
                                    className={`font-semibold ${item.adjustmentType === "penalty" ? "text-red-600" : item.adjustmentType === "bonus" ? "text-green-600" : "text-blue-600"}`}
                                  >
                                    {item.adjustmentType === "penalty" ? "-" : "+"}$
                                    {Math.abs(item.amount).toLocaleString()}
                                  </span>{" "}
                                  <span className="capitalize">({item.adjustmentType})</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Resulting salary: ${item.amount.toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1">{item.reason}</div>
                            </dd>
                          </div>
                        ))
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Reviews */}
            {activeTab === "performance" && selectedEmployee && (
              <div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Performance Reviews - {selectedEmployee.name}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Current performance rating: {selectedEmployee.performance}/5
                        </p>
                      </div>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Add Performance Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && user?.role === "admin" && (
                    <div className="px-4 py-5 bg-gray-50 sm:p-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">New Performance Review</h4>
                      <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-4">
                        <input type="hidden" value={selectedEmployee.id} {...registerReview("employeeId")} />
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                              Rating (1-5)
                            </label>
                            <input
                              type="number"
                              id="rating"
                              min="1"
                              max="5"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Rating from 1 to 5"
                              {...registerReview("rating")}
                            />
                            {reviewErrors.rating && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.rating.message?.toString()}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="reviewDate" className="block text-sm font-medium text-gray-700">
                              Review Date
                            </label>
                            <input
                              type="date"
                              id="reviewDate"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerReview("reviewDate")}
                            />
                            {reviewErrors.reviewDate && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.reviewDate.message?.toString()}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                              Feedback
                            </label>
                            <textarea
                              id="feedback"
                              rows={3}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Provide detailed feedback on performance"
                              {...registerReview("feedback")}
                            ></textarea>
                            {reviewErrors.feedback && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.feedback.message?.toString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Save Review
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {reviewsLoading ? (
                        <li className="px-4 py-4">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ) : performanceReviews?.length === 0 ? (
                        <li className="px-4 py-4 text-center text-sm text-gray-500">
                          No performance reviews available
                        </li>
                      ) : (
                        performanceReviews?.map((review) => (
                          <li key={review.id} className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {format(new Date(review.reviewDate), "MMMM d, yyyy")}
                              </div>
                              <div className={`text-sm font-semibold ${getRatingColor(review.rating)}`}>
                                Rating: {review.rating}/5
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">{review.feedback}</p>
                            <div className="mt-1 text-xs text-gray-400">Reviewed by: {review.reviewedBy}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
