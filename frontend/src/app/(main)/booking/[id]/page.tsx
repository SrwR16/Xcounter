'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, bookingsApi, couponsApi } from '@/lib/api';
import { Show, Booking } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  TicketIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SeatGridProps {
  totalSeats: number;
  availableSeats: number;
  selectedSeats: string[];
  onSeatSelect: (seat: string) => void;
  bookedSeats: string[];
}

function SeatGrid({ totalSeats, availableSeats, selectedSeats, onSeatSelect, bookedSeats }: SeatGridProps) {
  // Generate seat layout (assuming 10 seats per row)
  const seatsPerRow = 10;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  
  const generateSeatNumber = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
    return `${rowLetter}${col + 1}`;
  };

  const isSeatBooked = (seatNumber: string) => bookedSeats.includes(seatNumber);
  const isSeatSelected = (seatNumber: string) => selectedSeats.includes(seatNumber);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <div className="text-center mb-4">
          <div className="bg-gray-200 rounded-t-lg py-2 px-4 text-sm font-medium text-gray-700">
            SCREEN
          </div>
        </div>
        
        <div className="space-y-2">
          {Array.from({ length: totalRows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center space-x-1">
              <span className="w-8 text-center text-sm font-medium text-gray-500 flex items-center justify-center">
                {String.fromCharCode(65 + rowIndex)}
              </span>
              {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                const seatNumber = generateSeatNumber(rowIndex, colIndex);
                const isBooked = isSeatBooked(seatNumber);
                const isSelected = isSeatSelected(seatNumber);
                const seatExists = (rowIndex * seatsPerRow + colIndex + 1) <= totalSeats;

                if (!seatExists) {
                  return <div key={colIndex} className="w-8 h-8" />;
                }

                return (
                  <button
                    key={colIndex}
                    onClick={() => !isBooked && onSeatSelect(seatNumber)}
                    disabled={isBooked}
                    className={`w-8 h-8 rounded-t-lg text-xs font-medium transition-colors ${
                      isBooked
                        ? 'bg-red-200 text-red-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-200 text-green-800 hover:bg-green-300'
                    }`}
                    title={`Seat ${seatNumber}${isBooked ? ' (Booked)' : ''}`}
                  >
                    {colIndex + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-200 rounded-t mr-2"></div>
          Available
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-t mr-2"></div>
          Selected
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 rounded-t mr-2"></div>
          Booked
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Fetch show details
  const { data: show, isLoading: showLoading, error: showError } = useQuery({
    queryKey: ['show', id],
    queryFn: () => moviesApi.getShows({ id }).then(res => res.data.results[0]),
    enabled: !!id,
  });

  // Fetch existing bookings for this show to determine booked seats
  const { data: existingBookings } = useQuery({
    queryKey: ['show-bookings', id],
    queryFn: () => bookingsApi.getBookings({ show: id }).then(res => res.data.results),
    enabled: !!id,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => bookingsApi.createBooking(bookingData),
    onSuccess: (response) => {
      toast.success('Booking successful!');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push(`/booking/confirmation/${response.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Booking failed');
    },
  });

  // Validate coupon mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => couponsApi.validateCoupon(code),
    onSuccess: (response) => {
      setAppliedCoupon(response.data);
      toast.success('Coupon applied successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const getBookedSeats = () => {
    if (!existingBookings) return [];
    return existingBookings.flatMap(booking => booking.seats);
  };

  const handleSeatSelect = (seat: string) => {
    setSelectedSeats(prev => 
      prev.includes(seat) 
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      await validateCouponMutation.mutateAsync(couponCode);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const calculateTotal = () => {
    if (!show || selectedSeats.length === 0) return 0;
    
    const subtotal = show.ticket_price * selectedSeats.length;
    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'PERCENTAGE') {
        discount = (subtotal * appliedCoupon.discount_value) / 100;
        if (appliedCoupon.maximum_discount) {
          discount = Math.min(discount, appliedCoupon.maximum_discount);
        }
      } else {
        discount = appliedCoupon.discount_value;
      }
    }

    return Math.max(0, subtotal - discount);
  };

  const handleBooking = async () => {
    if (!show || selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    const bookingData = {
      show_id: show.id,
      seats: selectedSeats,
      coupon_code: appliedCoupon?.code || undefined,
    };

    createBookingMutation.mutate(bookingData);
  };

  if (showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (showError || !show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Show Not Found</h2>
          <p className="text-gray-600 mb-4">The show you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/movies')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Browse Movies
          </button>
        </div>
      </div>
    );
  }

  const bookedSeats = getBookedSeats();
  const subtotal = show.ticket_price * selectedSeats.length;
  const total = calculateTotal();
  const discount = subtotal - total;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie & Show Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="flex space-x-4 mb-6">
                <div className="relative w-24 h-32 flex-shrink-0">
                  <Image
                    src={show.movie.poster || '/placeholder-movie.jpg'}
                    alt={show.movie.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {show.movie.title}
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(new Date(show.start_time), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {format(new Date(show.start_time), 'h:mm a')}
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {show.theater.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat Selection Summary */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Selected Seats</h3>
                {selectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selectedSeats.map(seat => (
                      <span
                        key={seat}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">No seats selected</p>
                )}
              </div>

              {/* Coupon Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Coupon Code</h3>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-green-800 text-sm font-medium">
                      {appliedCoupon.name} applied!
                    </p>
                    <p className="text-green-600 text-xs">
                      {appliedCoupon.discount_type === 'PERCENTAGE'
                        ? `${appliedCoupon.discount_value}% off`
                        : `$${appliedCoupon.discount_value} off`}
                    </p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tickets ({selectedSeats.length})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || createBookingMutation.isPending}
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createBookingMutation.isPending ? 'Booking...' : 'Book Tickets'}
              </button>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Seats</h1>
              <p className="text-gray-600">
                Choose your preferred seats for {show.movie.title}
              </p>
            </div>

            <SeatGrid
              totalSeats={show.total_seats}
              availableSeats={show.available_seats}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              bookedSeats={bookedSeats}
            />

            {/* Show Info */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Show Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Theater:</span>
                  <p className="font-medium">{show.theater.name}</p>
                  <p className="text-gray-600">{show.theater.location}</p>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <p className="font-medium">{show.total_seats} seats</p>
                  <p className="text-gray-600">{show.available_seats} available</p>
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>
                  <p className="font-medium">${show.ticket_price}</p>
                  <p className="text-gray-600">per ticket</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}