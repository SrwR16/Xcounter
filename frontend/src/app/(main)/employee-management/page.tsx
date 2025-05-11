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

// Employee type definition
interface Employee {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "salesman" | "support";
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "onLeave";
  contactNumber: string;
}

// Form schema
const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "moderator", "salesman", "support"], {
    required_error: "Role is required",
  }),
  department: z.string().min(1, "Department is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  status: z.enum(["active", "inactive", "onLeave"], {
    required_error: "Status is required",
  }),
  contactNumber: z.string().min(1, "Contact number is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  // Fetch employees
  const {
    data: employees,
    isLoading: isLoadingEmployees,
    refetch,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "E001",
          name: "John Smith",
          email: "john.smith@xcounter.com",
          role: "admin",
          department: "Management",
          hireDate: "2022-01-15",
          status: "active",
          contactNumber: "+1 (555) 123-4567",
        },
        {
          id: "E002",
          name: "Sarah Johnson",
          email: "sarah.johnson@xcounter.com",
          role: "moderator",
          department: "Content",
          hireDate: "2022-03-22",
          status: "active",
          contactNumber: "+1 (555) 234-5678",
        },
        {
          id: "E003",
          name: "Michael Brown",
          email: "michael.brown@xcounter.com",
          role: "salesman",
          department: "Sales",
          hireDate: "2022-05-10",
          status: "active",
          contactNumber: "+1 (555) 345-6789",
        },
        {
          id: "E004",
          name: "Emily Davis",
          email: "emily.davis@xcounter.com",
          role: "support",
          department: "Customer Service",
          hireDate: "2022-07-05",
          status: "onLeave",
          contactNumber: "+1 (555) 456-7890",
        },
        {
          id: "E005",
          name: "David Wilson",
          email: "david.wilson@xcounter.com",
          role: "salesman",
          department: "Sales",
          hireDate: "2022-09-15",
          status: "inactive",
          contactNumber: "+1 (555) 567-8901",
        },
      ] as Employee[];
    },
    enabled: !!user && user.email.includes("admin"),
  });

  // Handle adding/editing employees
  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isEditing && selectedEmployee) {
        // Simulate employee update
        setActionSuccess(`Employee ${data.name} updated successfully`);
      } else {
        // Simulate employee creation
        setActionSuccess(`Employee ${data.name} added successfully`);
      }

      // Reset form
      setIsFormOpen(false);
      setIsEditing(false);
      setSelectedEmployee(null);
      reset();

      // Refetch employees
      refetch();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      setActionError("An error occurred. Please try again.");

      // Clear error message after 3 seconds
      setTimeout(() => {
        setActionError(null);
      }, 3000);
    }
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setIsFormOpen(true);

    // Reset form with employee data
    reset({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      hireDate: employee.hireDate,
      status: employee.status,
      contactNumber: employee.contactNumber,
    });
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate employee deletion
        setActionSuccess("Employee deleted successfully");

        // Refetch employees
        refetch();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setActionSuccess(null);
        }, 3000);
      } catch (error) {
        setActionError("An error occurred while deleting the employee. Please try again.");

        // Clear error message after 3 seconds
        setTimeout(() => {
          setActionError(null);
        }, 3000);
      }
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "onLeave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "moderator":
        return "bg-blue-100 text-blue-800";
      case "salesman":
        return "bg-indigo-100 text-indigo-800";
      case "support":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Employee Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">Manage employee accounts, roles, and permissions</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedEmployee(null);
                  reset({
                    name: "",
                    email: "",
                    role: "salesman",
                    department: "",
                    hireDate: new Date().toISOString().split("T")[0],
                    status: "active",
                    contactNumber: "",
                  });
                  setIsFormOpen(true);
                }}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </button>
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

          {/* Employee Form */}
          {isFormOpen && (
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
              <div className="md:flex md:items-center md:justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditing ? "Edit Employee" : "Add New Employee"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setIsEditing(false);
                    setSelectedEmployee(null);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="name"
                        {...register("name")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        {...register("email")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <div className="mt-1">
                      <select
                        id="role"
                        {...register("role")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="salesman">Salesman</option>
                        <option value="support">Support</option>
                      </select>
                      {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="department"
                        {...register("department")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">
                      Hire Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        id="hireDate"
                        {...register("hireDate")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.hireDate && <p className="mt-1 text-sm text-red-600">{errors.hireDate.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="mt-1">
                      <select
                        id="status"
                        {...register("status")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="onLeave">On Leave</option>
                      </select>
                      {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                      Contact Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="contactNumber"
                        {...register("contactNumber")}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.contactNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setIsEditing(false);
                      setSelectedEmployee(null);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {isEditing ? "Update Employee" : "Add Employee"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Employees List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Employees</h3>
              <p className="mt-1 text-sm text-gray-500">A list of all employees in the system</p>
            </div>

            {isLoadingEmployees ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : employees && employees.length > 0 ? (
              <div className="overflow-x-auto">
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
                        Role & Department
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact Information
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
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-medium">
                                  {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">ID: {employee.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(employee.role)}`}
                          >
                            {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">{employee.department}</div>
                          <div className="text-xs text-gray-500">
                            Since: {new Date(employee.hireDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.email}</div>
                          <div className="text-sm text-gray-500">{employee.contactNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(employee.status)}`}
                          >
                            {employee.status === "onLeave"
                              ? "On Leave"
                              : employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleEditEmployee(employee)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(employee.id)}
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
                <p className="text-gray-500">No employees found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
