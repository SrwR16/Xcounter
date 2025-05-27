'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { format } from 'date-fns';
import { 
  TicketIcon, 
  CalendarIcon, 
  MapPinIcon,
  StarIcon,
  TrophyIcon,
  DownloadIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface PromotionBadgeProps {
  level: 'SILVER' | 'GOLD' | 'PLATINUM' | null;
  ticketCount: number;
}

function PromotionBadge({ level, ticketCount }: PromotionBadgeProps) {
  const getNextLevel = () => {
    if (ticketCount < 100) return { name: 'SILVER', required: 100, discount: 5 };
    if (ticketCount < 300) return { name: 'GOLD', required: 300, discount: 10 };
    if (ticketCount < 500) return { name: 'PLATINUM', required: 500, discount: 20 };
    return null;
  };

  const getCurrentLevel = () => {
    switch (level) {
      case 'SILVER': return { name: 'Silver', discount: 5, color: 'bg-gray-100 text-gray-800' };
      case 'GOLD': return { name: 'Gold', discount: 10, color: 'bg-yellow-100 text-yellow-800' };
      case 'PLATINUM': return { name: 'Platinum', discount: 20, color: 'bg-purple-100 text-purple-800' };
      default: return { name: 'Standard', discount: 0, color: 'bg-blue-100 text-blue-800' };
    }
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Membership Status</h3>
        <TrophyIcon className="h-6 w-6 text-yellow-500" />
      </div>
      
      <div className="flex items-center space-x-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentLevel.color}`}>
          {currentLevel.name} Member
        </span>
        {currentLevel.discount > 0 && (
          <span className="text-sm text-gray-600">
            {currentLevel.discount}% discount on all bookings
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Tickets this year: {ticketCount}</span>
          {nextLevel && <span>Next level: {nextLevel.required}</span>}
        </div>
        {nextLevel && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((ticketCount / nextLevel.required) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {nextLevel && (
        <p className="text-sm text-gray-600">
          {nextLevel.required - ticketCount} more tickets to unlock {nextLevel.name} status 
          and get {nextLevel.discount}% discount!
        </p>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: any;
}

function BookingCard({ booking }: BookingCardProps) {
  const isUpcoming = new Date(booking.show.start_time) > new Date();
  const isPast = new Date(booking.show.start_time) < new Date();

  const handleDownloadTicket = () => {
    // Implement PDF download
    window.open(`/api/bookings/${booking.id}/download`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex space-x-4">
          <div className="relative w-16 h-20 flex-shrink-0">
            <Image
              src={booking.show.movie.poster || '/placeholder-movie.jpg'}
              alt={booking.show.movie.title}
              fill
              className="object-cover rounded"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {booking.show.movie.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(new Date(booking.show.start_time), 'MMM d, yyyy')} at{' '}
                {format(new Date(booking.show.start_time), 'h:mm a')}
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {booking.show.theater.name}
              </div>
              <div className="flex items-center">
                <TicketIcon className="h-4 w-4 mr-2" />
                Seats: {booking.seats.join(', ')}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-600">Total paid: </span>
                <span className="font-medium text-gray-900">${booking.total_amount}</span>
                {booking.discount_amount > 0 && (
                  <span className="text-green-600 ml-2">
                    (${booking.discount_amount} saved)
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Link
                  href={`/booking/details/${booking.id}`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={handleDownloadTicket}
                    className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  >
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: () => bookingsApi.getUserBookings().then(res => res.data.results),
  });

  // Fetch user profile with promotion status
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then(res => res.data),
  });

  const getBookingStats = () => {
    if (!bookings) return { total: 0, upcoming: 0, past: 0, cancelled: 0 };
    
    const now = new Date();
    return {
      total: bookings.length,
      upcoming: bookings.filter(b => new Date(b.show.start_time) > now && b.status === 'CONFIRMED').length,
      past: bookings.filter(b => new Date(b.show.start_time) < now && b.status === 'CONFIRMED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    };
  };

  const getUpcomingBookings = () => {
    if (!bookings) return [];
    const now = new Date();
    return bookings
      .filter(b => new Date(b.show.start_time) > now && b.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.show.start_time).getTime() - new Date(b.show.start_time).getTime())
      .slice(0, 3);
  };

  const getRecentBookings = () => {
    if (!bookings) return [];
    return bookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const stats = getBookingStats();
  const upcomingBookings = getUpcomingBookings();
  const recentBookings = getRecentBookings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Movie Lover'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your bookings, track your membership status, and discover new movies.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TicketIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.past}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Year</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.tickets_this_year || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Upcoming Movies</h2>
              </div>
              <div className="p-6">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming bookings</p>
                    <Link
                      href="/movies"
                      className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-500"
                    >
                      Browse movies to book
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Booking History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
                <Link
                  href="/customer/bookings"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
              <div className="p-6">
                {bookingsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="w-16 h-20 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No bookings yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Promotion Status */}
            <PromotionBadge 
              level={profile?.promotion_level}
              ticketCount={profile?.tickets_this_year || 0}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/movies"
                  className="block w-full bg-indigo-600 text-white text-center py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Browse Movies
                </Link>
                <Link
                  href="/customer/bookings"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  View All Bookings
                </Link>
                <Link
                  href="/customer/profile"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium">
                    {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total spent:</span>
                  <span className="font-medium">${profile?.total_spent || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Movies watched:</span>
                  <span className="font-medium">{stats.past}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Savings from coupons:</span>
                  <span className="font-medium text-green-600">
                    ${profile?.total_savings || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}