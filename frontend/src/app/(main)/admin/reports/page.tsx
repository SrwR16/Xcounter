"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const reportSchema = z.object({
  reportType: z.enum(["sales", "movie", "employee"]),
  dateRange: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["pdf", "csv"]),
  includeCharts: z.boolean().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "sales",
      dateRange: "monthly",
      format: "pdf",
      includeCharts: true,
    },
  });

  // Watch values for conditional rendering
  const watchReportType = watch("reportType");
  const watchDateRange = watch("dateRange");
  const watchFormat = watch("format");

  // Get date inputs based on date range
  const needsCustomDates = watchDateRange === "custom";

  // Handle form submission
  const onSubmit = async (data: ReportFormData) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setDownloadUrl(null);

    try {
      // Simulate API call to generate report
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, we would get the URL from the API response
      // Mock a download URL
      const mockFileName = `${data.reportType}_report_${new Date().toISOString().split("T")[0]}.${data.format}`;
      setDownloadUrl(`/api/reports/download/${mockFileName}`);

      setSuccess(true);
    } catch (err) {
      setError("Failed to generate report. Please try again.");
      console.error("Report generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // If not authenticated or not admin, redirect to login
  if (!authLoading && (!user || (user?.role !== "admin" && user?.role !== "moderator"))) {
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Generate Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and download comprehensive reports in PDF or CSV format
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Report Options</h3>
                  <p className="mt-1 text-sm text-gray-500">Customize and generate detailed reports</p>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
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
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div>
                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                          Report Type
                        </label>
                        <select
                          id="reportType"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          {...register("reportType")}
                          disabled={isGenerating}
                        >
                          <option value="sales">Sales Report</option>
                          <option value="movie">Movie Performance Report</option>
                          <option value="employee">Employee Performance Report</option>
                        </select>
                        {errors.reportType && <p className="mt-1 text-sm text-red-600">{errors.reportType.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
                          Date Range
                        </label>
                        <select
                          id="dateRange"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          {...register("dateRange")}
                          disabled={isGenerating}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        {errors.dateRange && <p className="mt-1 text-sm text-red-600">{errors.dateRange.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                          Format
                        </label>
                        <select
                          id="format"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          {...register("format")}
                          disabled={isGenerating}
                        >
                          <option value="pdf">PDF Document</option>
                          <option value="csv">CSV Spreadsheet</option>
                        </select>
                        {errors.format && <p className="mt-1 text-sm text-red-600">{errors.format.message}</p>}
                      </div>

                      <div className="flex items-center h-full pt-5">
                        <input
                          id="includeCharts"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          {...register("includeCharts")}
                          disabled={isGenerating || watchFormat === "csv"}
                        />
                        <label htmlFor="includeCharts" className="ml-2 block text-sm text-gray-700">
                          Include charts and visualizations
                          {watchFormat === "csv" && <span className="text-gray-400 ml-1">(PDF only)</span>}
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                            Generating Report...
                          </span>
                        ) : (
                          "Generate Report"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Report Preview</h3>
                  <p className="mt-1 text-sm text-gray-500">Details of the report you are about to generate</p>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Report Type</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {watchReportType === "sales"
                        ? "Sales Report"
                        : watchReportType === "movie"
                          ? "Movie Performance Report"
                          : "Employee Performance Report"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {watchReportType === "sales"
                        ? "Overview of ticket sales, revenue, and trends"
                        : watchReportType === "movie"
                          ? "Analysis of movie popularity, revenue, and audience metrics"
                          : "Staff performance metrics and activity summary"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date Range</h4>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{watchDateRange}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Format</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {watchFormat.toUpperCase()} {watchFormat === "pdf" ? "Document" : "Spreadsheet"}
                    </p>
                  </div>

                  {success && downloadUrl && (
                    <div className="rounded-md bg-green-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
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
                          <h3 className="text-sm font-medium text-green-800">Report generated successfully</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>Your report is ready to download.</p>
                            <div className="mt-4">
                              <a
                                href={downloadUrl}
                                download
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              >
                                <svg
                                  className="-ml-0.5 mr-2 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  ></path>
                                </svg>
                                Download Report
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Available Reports</h3>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Monthly Sales Report - February 2025</span>
                      </div>
                      <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        Download
                      </a>
                    </li>
                    <li className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Movie Performance Report - Q1 2025</span>
                      </div>
                      <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        Download
                      </a>
                    </li>
                    <li className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          Employee Performance Report - March 2025
                        </span>
                      </div>
                      <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        Download
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
