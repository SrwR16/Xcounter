"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useCreateEmployee,
  useCreatePerformanceReview,
  useCreateSalaryAdjustment,
  useEmployeePerformanceReviews,
  useEmployees,
  useEmployeeSalaryHistory,
  useUpdateEmployee,
} from "@/hooks/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Form validation schemas
const employeeSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["ADMIN", "MODERATOR", "EMPLOYEE"]),
  salary: z
    .string()
    .min(1, "Salary is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Salary must be a positive number",
    }),
  hire_date: z.string().min(1, "Hire date is required"),
});

const salaryAdjustmentSchema = z.object({
  employee: z.number().min(1, "Employee is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
      message: "Amount must be a non-zero number",
    }),
  adjustment_type: z.enum(["INCREMENT", "PENALTY", "BONUS"]),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  effective_date: z.string().min(1, "Effective date is required"),
});

const performanceReviewSchema = z.object({
  employee: z.number().min(1, "Employee is required"),
  rating: z
    .string()
    .min(1, "Rating is required")
    .refine(
      (val) => {
        const rating = Number(val);
        return !isNaN(rating) && rating >= 1 && rating <= 5;
      },
      { message: "Rating must be between 1 and 5" }
    ),
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  review_date: z.string().min(1, "Review date is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;
type SalaryAdjustmentFormData = z.infer<typeof salaryAdjustmentSchema>;
type PerformanceReviewFormData = z.infer<typeof performanceReviewSchema>;

export default function EmployeesManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "salary" | "performance">("employees");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // API Hooks
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const createSalaryAdjustmentMutation = useCreateSalaryAdjustment();
  const createPerformanceReviewMutation = useCreatePerformanceReview();

  const { data: salaryHistory, isLoading: salaryLoading } = useEmployeeSalaryHistory(selectedEmployee?.id);
  const { data: performanceReviews, isLoading: reviewsLoading } = useEmployeePerformanceReviews(selectedEmployee?.id);

  // Forms
  const {
    register: registerEmployee,
    handleSubmit: handleEmployeeSubmit,
    formState: { errors: employeeErrors },
    reset: resetEmployeeForm,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const {
    register: registerSalary,
    handleSubmit: handleSalarySubmit,
    formState: { errors: salaryErrors },
    reset: resetSalaryForm,
  } = useForm<SalaryAdjustmentFormData>({
    resolver: zodResolver(salaryAdjustmentSchema),
  });

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    reset: resetReviewForm,
  } = useForm<PerformanceReviewFormData>({
    resolver: zodResolver(performanceReviewSchema),
  });

  // Handle employee creation
  const onCreateEmployee = async (data: EmployeeFormData) => {
    try {
      await createEmployeeMutation.mutateAsync({
        ...data,
        salary: parseFloat(data.salary),
      });
      toast.success("Employee created successfully!");
      setIsAddingEmployee(false);
      resetEmployeeForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create employee");
    }
  };

  // Handle salary adjustment
  const onSalaryAdjust = async (data: SalaryAdjustmentFormData) => {
    try {
      await createSalaryAdjustmentMutation.mutateAsync({
        ...data,
        amount: parseFloat(data.amount),
      });
      toast.success("Salary adjustment created successfully!");
      setShowSalaryForm(false);
      resetSalaryForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create salary adjustment");
    }
  };

  // Handle performance review
  const onReviewSubmit = async (data: PerformanceReviewFormData) => {
    try {
      await createPerformanceReviewMutation.mutateAsync({
        ...data,
        rating: parseInt(data.rating),
      });
      toast.success("Performance review created successfully!");
      setShowReviewForm(false);
      resetReviewForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create performance review");
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  // Access control
  if (!authLoading && (!user || (user?.role !== "ADMIN" && user?.role !== "MODERATOR"))) {
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
                {user?.role === "ADMIN"
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
                    toast.error("Please select an employee first");
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
                    toast.error("Please select an employee first");
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
                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => setIsAddingEmployee(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Add New Employee
                    </button>
                  )}
                </div>

                {/* Add Employee Form */}
                {isAddingEmployee && user?.role === "ADMIN" && (
                  <div className="bg-white shadow sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Employee</h3>
                      <form onSubmit={handleEmployeeSubmit(onCreateEmployee)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("username")}
                            />
                            {employeeErrors.username && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.username.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("email")}
                            />
                            {employeeErrors.email && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.email.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                              type="password"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("password")}
                            />
                            {employeeErrors.password && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.password.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("first_name")}
                            />
                            {employeeErrors.first_name && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.first_name.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("last_name")}
                            />
                            {employeeErrors.last_name && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.last_name.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("role")}
                            >
                              <option value="EMPLOYEE">Employee</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            {employeeErrors.role && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.role.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Salary</label>
                            <input
                              type="number"
                              step="0.01"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("salary")}
                            />
                            {employeeErrors.salary && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.salary.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                            <input
                              type="date"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerEmployee("hire_date")}
                            />
                            {employeeErrors.hire_date && (
                              <p className="mt-1 text-sm text-red-600">{employeeErrors.hire_date.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsAddingEmployee(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={createEmployeeMutation.isPending}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Employees Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeesLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          </td>
                        </tr>
                      ) : (
                        employees?.map((employee) => (
                          <tr
                            key={employee.id}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedEmployee?.id === employee.id ? "bg-blue-50" : ""}`}
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{employee.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">{employee.role.toLowerCase()}</div>
                              <div className="text-xs text-gray-500">
                                Since {format(new Date(employee.hire_date), "MMM d, yyyy")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.is_active ? "active" : "inactive")}`}
                              >
                                {employee.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${employee.salary?.toLocaleString() || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`font-medium ${getRatingColor(employee.performance_rating || 0)}`}>
                                  {employee.performance_rating || "N/A"}/5
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
                          Salary History - {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Current salary: ${selectedEmployee.salary?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      {user?.role === "ADMIN" && (
                        <button
                          onClick={() => setShowSalaryForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Add Salary Adjustment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Salary Form */}
                  {showSalaryForm && user?.role === "ADMIN" && (
                    <div className="px-4 py-5 bg-gray-50 sm:p-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">New Salary Adjustment</h4>
                      <form onSubmit={handleSalarySubmit(onSalaryAdjust)} className="space-y-4">
                        <input
                          type="hidden"
                          value={selectedEmployee.id}
                          {...registerSalary("employee", { valueAsNumber: true })}
                        />
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="e.g., 300 for increment, -100 for penalty"
                              {...registerSalary("amount")}
                            />
                            {salaryErrors.amount && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.amount.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                            <select
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerSalary("adjustment_type")}
                            >
                              <option value="INCREMENT">Increment</option>
                              <option value="PENALTY">Penalty</option>
                              <option value="BONUS">Bonus</option>
                            </select>
                            {salaryErrors.adjustment_type && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.adjustment_type.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                            <input
                              type="date"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerSalary("effective_date")}
                            />
                            {salaryErrors.effective_date && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.effective_date.message}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <textarea
                              rows={3}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Explain the reason for this adjustment"
                              {...registerSalary("reason")}
                            />
                            {salaryErrors.reason && (
                              <p className="mt-1 text-sm text-red-600">{salaryErrors.reason.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowSalaryForm(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={createSalaryAdjustmentMutation.isPending}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {createSalaryAdjustmentMutation.isPending ? "Saving..." : "Save Adjustment"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {salaryLoading ? (
                        <div className="py-4 sm:py-5 sm:px-6">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      ) : salaryHistory?.length === 0 ? (
                        <div className="py-4 sm:py-5 sm:px-6 text-center text-sm text-gray-500">
                          No salary history available
                        </div>
                      ) : (
                        salaryHistory?.map((item) => (
                          <div key={item.id} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              {format(new Date(item.effective_date), "MMM d, yyyy")}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex justify-between">
                                <div>
                                  <span
                                    className={`font-semibold ${item.adjustment_type === "PENALTY" ? "text-red-600" : item.adjustment_type === "BONUS" ? "text-green-600" : "text-blue-600"}`}
                                  >
                                    {item.adjustment_type === "PENALTY" ? "-" : "+"}$
                                    {Math.abs(item.amount).toLocaleString()}
                                  </span>{" "}
                                  <span className="capitalize">({item.adjustment_type.toLowerCase()})</span>
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
                          Performance Reviews - {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Current performance rating: {selectedEmployee.performance_rating || "N/A"}/5
                        </p>
                      </div>
                      {user?.role === "ADMIN" && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Add Performance Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && user?.role === "ADMIN" && (
                    <div className="px-4 py-5 bg-gray-50 sm:p-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">New Performance Review</h4>
                      <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-4">
                        <input
                          type="hidden"
                          value={selectedEmployee.id}
                          {...registerReview("employee", { valueAsNumber: true })}
                        />
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerReview("rating")}
                            />
                            {reviewErrors.rating && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.rating.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Review Date</label>
                            <input
                              type="date"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              {...registerReview("review_date")}
                            />
                            {reviewErrors.review_date && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.review_date.message}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Feedback</label>
                            <textarea
                              rows={3}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Provide detailed feedback on performance"
                              {...registerReview("feedback")}
                            />
                            {reviewErrors.feedback && (
                              <p className="mt-1 text-sm text-red-600">{reviewErrors.feedback.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={createPerformanceReviewMutation.isPending}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {createPerformanceReviewMutation.isPending ? "Saving..." : "Save Review"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {reviewsLoading ? (
                        <li className="px-4 py-4">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
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
                                {format(new Date(review.review_date), "MMMM d, yyyy")}
                              </div>
                              <div className={`text-sm font-semibold ${getRatingColor(review.rating)}`}>
                                Rating: {review.rating}/5
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">{review.feedback}</p>
                            <div className="mt-1 text-xs text-gray-400">
                              Reviewed by: {review.reviewed_by?.first_name} {review.reviewed_by?.last_name}
                            </div>
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
