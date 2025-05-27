'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, bookingsApi, couponsApi, employeesApi } from '@/lib/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  ChartBarIcon, 
  TicketIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last period
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface CouponCardProps {
  coupon: any;
  onEdit: (coupon: any) => void;
  onDelete: (id: string) => void;
}

function CouponCard({ coupon, onEdit, onDelete }: CouponCardProps) {
  const isExpired = new Date(coupon.valid_until) < new Date();
  const isActive = coupon.is_active && !isExpired;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{coupon.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Code:</span>
          <p className="font-mono font-medium">{coupon.code}</p>
        </div>
        <div>
          <span className="text-gray-500">Discount:</span>
          <p className="font-medium">
            {coupon.discount_type === 'PERCENTAGE' 
              ? `${coupon.discount_value}%` 
              : `$${coupon.discount_value}`}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Usage:</span>
          <p className="font-medium">{coupon.used_count}/{coupon.usage_limit || '∞'}</p>
        </div>
        <div>
          <span className="text-gray-500">Valid until:</span>
          <p className="font-medium">{format(new Date(coupon.valid_until), 'MMM d, yyyy')}</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(coupon)}
          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          <PencilIcon className="h-4 w-4 inline mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(coupon.id)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
        >
          <TrashIcon className="h-4 w-4 inline mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ModeratorDashboard() {
  const [dateRange, setDateRange] = useState('week');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['moderator-dashboard', dateRange],
    queryFn: () => dashboardApi.getModeratorDashboard({ period: dateRange }),
  });

  // Fetch recent bookings
  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: () => bookingsApi.getBookings({ limit: 10, ordering: '-created_at' }),
  });

  // Fetch coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsApi.getCoupons(),
  });

  // Fetch employees (salesmen)
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getEmployees({ role: 'SALESMAN' }),
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => couponsApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setShowCouponModal(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCouponMutation.mutate(id);
    }
  };

  const getChartData = () => {
    if (!dashboardData) return null;

    const ticketSalesData = {
      labels: dashboardData.daily_sales?.map((item: any) => 
        format(new Date(item.date), 'MMM d')
      ) || [],
      datasets: [
        {
          label: 'Tickets Sold',
          data: dashboardData.daily_sales?.map((item: any) => item.tickets) || [],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };

    const revenueData = {
      labels: dashboardData.daily_sales?.map((item: any) => 
        format(new Date(item.date), 'MMM d')
      ) || [],
      datasets: [
        {
          label: 'Revenue ($)',
          data: dashboardData.daily_sales?.map((item: any) => item.revenue) || [],
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    };

    return { ticketSalesData, revenueData };
  };

  const chartData = getChartData();

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage bookings, coupons, and monitor performance
            </p>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button
              onClick={() => setShowCouponModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Tickets Sold"
            value={dashboardData?.total_tickets || 0}
            change={dashboardData?.tickets_change}
            icon={<TicketIcon className="h-6 w-6 text-blue-600" />}
            color="bg-blue-100"
          />
          
          <StatsCard
            title="Total Revenue"
            value={`$${dashboardData?.total_revenue || 0}`}
            change={dashboardData?.revenue_change}
            icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
            color="bg-green-100"
          />
          
          <StatsCard
            title="Canceled Bookings"
            value={dashboardData?.canceled_bookings || 0}
            change={dashboardData?.canceled_change}
            icon={<CalendarIcon className="h-6 w-6 text-red-600" />}
            color="bg-red-100"
          />
          
          <StatsCard
            title="Active Salesmen"
            value={employees?.data?.results?.length || 0}
            icon={<UserGroupIcon className="h-6 w-6 text-purple-600" />}
            color="bg-purple-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Sales Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Sales Trend</h3>
              {chartData?.ticketSalesData && (
                <Bar
                  data={chartData.ticketSalesData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                  }}
                />
              )}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
              {chartData?.revenueData && (
                <Line
                  data={chartData.revenueData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                  }}
                />
              )}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                <Link
                  href="/moderator/bookings"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
              <div className="p-6">
                {recentBookings?.data?.results?.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.data.results.slice(0, 5).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.show.movie.title}</p>
                            <p className="text-sm text-gray-600">
                              {booking.customer.name} • {booking.seats.length} seat(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${booking.total_amount}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(booking.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent bookings</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/moderator/bookings"
                  className="block w-full bg-indigo-600 text-white text-center py-2 rounded-md hover:bg-indigo-700"
                >
                  Manage Bookings
                </Link>
                <Link
                  href="/moderator/shows"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50"
                >
                  Manage Shows
                </Link>
                <Link
                  href="/moderator/employees"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50"
                >
                  Manage Salesmen
                </Link>
                <Link
                  href="/moderator/reports"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50"
                >
                  Generate Reports
                </Link>
              </div>
            </div>

            {/* Top Movies */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Movies</h3>
              {dashboardData?.top_movies?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.top_movies.slice(0, 5).map((movie: any, index: number) => (
                    <div key={movie.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{movie.title}</p>
                          <p className="text-xs text-gray-600">{movie.tickets_sold} tickets</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">${movie.revenue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No data available</p>
              )}
            </div>

            {/* Employee Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Salesmen</h3>
              {dashboardData?.top_salesmen?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.top_salesmen.slice(0, 5).map((salesman: any, index: number) => (
                    <div key={salesman.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{salesman.name}</p>
                          <p className="text-xs text-gray-600">{salesman.bookings_count} bookings</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">${salesman.revenue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Coupons Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Coupons</h2>
            <Link
              href="/moderator/coupons"
              className="text-indigo-600 hover:text-indigo-500"
            >
              View all coupons
            </Link>
          </div>
          
          {couponsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : coupons?.data?.results?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.data.results.slice(0, 6).map((coupon: any) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={handleEditCoupon}
                  onDelete={handleDeleteCoupon}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No coupons created yet</p>
              <button
                onClick={() => setShowCouponModal(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-500"
              >
                Create your first coupon
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}