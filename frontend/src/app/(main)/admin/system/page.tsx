"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema for management commands
const commandSchema = z.object({
  commandType: z.enum([
    "cleanup_expired_shows",
    "generate_monthly_report",
    "create_system_backup",
    "send_automated_notifications",
  ]),
  days: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Days must be a number",
    }),
  month: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 12), {
      message: "Month must be a number between 1 and 12",
    }),
  year: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 2020 && Number(val) <= 2100), {
      message: "Year must be a valid year between 2020 and 2100",
    }),
  format: z.enum(["csv", "text"]).optional(),
  backupDir: z.string().optional(),
  includeMedia: z.boolean().optional(),
  compress: z.boolean().optional(),
  delete: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

type CommandFormData = z.infer<typeof commandSchema>;

export default function SystemManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CommandFormData>({
    resolver: zodResolver(commandSchema),
    defaultValues: {
      commandType: "cleanup_expired_shows",
      days: "30",
      format: "csv",
      dryRun: true,
      includeMedia: true,
      compress: true,
    },
  });

  // Watch values for conditional rendering
  const watchCommandType = watch("commandType");

  // Handle form submission
  const onSubmit = async (data: CommandFormData) => {
    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setCommandOutput(null);
    setJobId(null);

    try {
      // Simulate API call to execute management command
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Format the command for display
      let commandString = `python manage.py ${data.commandType}`;

      if (data.commandType === "cleanup_expired_shows") {
        if (data.days) commandString += ` --days=${data.days}`;
        if (data.delete) commandString += " --delete";
        if (data.dryRun) commandString += " --dry-run";
      } else if (data.commandType === "generate_monthly_report") {
        if (data.month) commandString += ` --month=${data.month}`;
        if (data.year) commandString += ` --year=${data.year}`;
        if (data.format) commandString += ` --format=${data.format}`;
      } else if (data.commandType === "create_system_backup") {
        if (data.backupDir) commandString += ` --backup-dir=${data.backupDir}`;
        if (data.includeMedia) commandString += " --include-media";
        if (data.compress) commandString += " --compress";
      }

      // Mock a job ID for tracking
      const mockJobId = `job_${Math.random().toString(36).substring(2, 10)}`;
      setJobId(mockJobId);

      // Mock command output
      const mockOutputs = {
        cleanup_expired_shows: "Found 12 expired shows. Marked as archived. No shows were deleted (dry-run mode).",
        generate_monthly_report: "Generated monthly report for May 2025. Files saved to reports/ directory.",
        create_system_backup: "System backup created successfully. Backup ID: BKP-20250515-001",
        send_automated_notifications:
          "Sent 56 notifications: 23 show reminders, 15 booking confirmations, 10 movie premieres, 8 system announcements.",
      };

      setCommandOutput(mockOutputs[data.commandType as keyof typeof mockOutputs]);
      setSuccess(true);
    } catch (err) {
      setError("Failed to execute command. Please check system logs and try again.");
      console.error("Command execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  // If not authenticated or not admin, redirect to login
  if (!authLoading && (!user || user?.role !== "admin")) {
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">System Management</h1>
              <p className="mt-1 text-sm text-gray-500">Execute management commands and system operations</p>
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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Management Commands</h3>
                  <p className="mt-1 text-sm text-gray-500">Execute system management and maintenance operations</p>
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
                    <div>
                      <label htmlFor="commandType" className="block text-sm font-medium text-gray-700">
                        Command Type
                      </label>
                      <select
                        id="commandType"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        {...register("commandType")}
                        disabled={isExecuting}
                      >
                        <option value="cleanup_expired_shows">Cleanup Expired Shows</option>
                        <option value="generate_monthly_report">Generate Monthly Report</option>
                        <option value="create_system_backup">Create System Backup</option>
                        <option value="send_automated_notifications">Send Automated Notifications</option>
                      </select>
                      {errors.commandType && <p className="mt-1 text-sm text-red-600">{errors.commandType.message}</p>}
                    </div>

                    {/* Dynamic parameters based on command type */}
                    {watchCommandType === "cleanup_expired_shows" && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="days" className="block text-sm font-medium text-gray-700">
                            Days (shows older than this will be archived)
                          </label>
                          <input
                            type="text"
                            id="days"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="30"
                            {...register("days")}
                            disabled={isExecuting}
                          />
                          {errors.days && <p className="mt-1 text-sm text-red-600">{errors.days.message}</p>}
                        </div>
                        <div className="flex items-center">
                          <input
                            id="delete"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            {...register("delete")}
                            disabled={isExecuting}
                          />
                          <label htmlFor="delete" className="ml-2 block text-sm text-gray-700">
                            Delete expired shows instead of marking as archived
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="dryRun"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            {...register("dryRun")}
                            disabled={isExecuting}
                          />
                          <label htmlFor="dryRun" className="ml-2 block text-sm text-gray-700">
                            Perform a dry run (no changes will be made)
                          </label>
                        </div>
                      </div>
                    )}

                    {watchCommandType === "generate_monthly_report" && (
                      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                          <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                            Month (1-12)
                          </label>
                          <input
                            type="text"
                            id="month"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Current month"
                            {...register("month")}
                            disabled={isExecuting}
                          />
                          {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>}
                        </div>
                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                            Year
                          </label>
                          <input
                            type="text"
                            id="year"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Current year"
                            {...register("year")}
                            disabled={isExecuting}
                          />
                          {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
                        </div>
                        <div>
                          <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                            Format
                          </label>
                          <select
                            id="format"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            {...register("format")}
                            disabled={isExecuting}
                          >
                            <option value="csv">CSV</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {watchCommandType === "create_system_backup" && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="backupDir" className="block text-sm font-medium text-gray-700">
                            Backup Directory (optional)
                          </label>
                          <input
                            type="text"
                            id="backupDir"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="/path/to/backups"
                            {...register("backupDir")}
                            disabled={isExecuting}
                          />
                          {errors.backupDir && <p className="mt-1 text-sm text-red-600">{errors.backupDir.message}</p>}
                        </div>
                        <div className="flex items-center">
                          <input
                            id="includeMedia"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            {...register("includeMedia")}
                            disabled={isExecuting}
                          />
                          <label htmlFor="includeMedia" className="ml-2 block text-sm text-gray-700">
                            Include media files in the backup
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="compress"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            {...register("compress")}
                            disabled={isExecuting}
                          />
                          <label htmlFor="compress" className="ml-2 block text-sm text-gray-700">
                            Compress the backup files using gzip
                          </label>
                        </div>
                      </div>
                    )}

                    {watchCommandType === "send_automated_notifications" && (
                      <div className="p-4 bg-yellow-50 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Notification Information</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>This command will send all pending automated notifications, including:</p>
                              <ul className="list-disc pl-5 mt-1 space-y-1">
                                <li>Upcoming show reminders (24 hours before showtime)</li>
                                <li>Booking confirmation reminders for pending bookings</li>
                                <li>Movie premiere announcements</li>
                                <li>Re-engagement emails for inactive users</li>
                                <li>System announcements</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                        disabled={isExecuting}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
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
                            Executing...
                          </span>
                        ) : (
                          "Execute Command"
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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Command Output</h3>
                  <p className="mt-1 text-sm text-gray-500">Results and information from the executed command</p>
                </div>

                <div className="border-t border-gray-200">
                  {success && commandOutput ? (
                    <div className="p-4 bg-black rounded-b-lg">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        $ {watchCommandType} {jobId && `[Job ID: ${jobId}]`}
                        {"\n"}
                        {"\n"}
                        {commandOutput}
                      </pre>
                    </div>
                  ) : (
                    <div className="px-4 py-5 sm:p-6 text-center text-gray-500 italic text-sm">
                      Command output will appear here after execution
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Commands</h3>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">create_system_backup</p>
                          <p className="text-xs text-gray-500 mt-1">Executed 2 hours ago</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Success
                        </span>
                      </div>
                    </li>
                    <li className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">generate_monthly_report</p>
                          <p className="text-xs text-gray-500 mt-1">Executed 1 day ago</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Success
                        </span>
                      </div>
                    </li>
                    <li className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">cleanup_expired_shows</p>
                          <p className="text-xs text-gray-500 mt-1">Executed 3 days ago</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      </div>
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
