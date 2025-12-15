'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authApi, fetchWithAuth } from '../lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  space: {
    _id: string;
    name: string;
    sportType: string;
    address: string;
    city: string;
    state: string;
    images: { url: string; publicId: string }[];
    pricePerHour: number;
  };
  user?: {
    _id: string;
    username: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  contactNumber: string;
  notes?: string;
  createdAt: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Booking[]>([]);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'my-bookings' | 'received'>('my-bookings');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      const authenticated = await authApi.ensureUser();
      if (!isActive) {
        return;
      }

      if (!authenticated) {
        router.push('/login');
        return;
      }

      setIsLoading(false);
      fetchBookings();
      fetchReceivedBookings();
    };

    init();

    return () => {
      isActive = false;
    };
  }, [router]);

  const fetchBookings = async () => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/bookings/my-bookings`);

      if (response.ok) {
        const data = await response.json();
        const activeBookings = data.bookings.filter((b: Booking) => b.status !== 'cancelled');
        setBookings(activeBookings);
      } else if (response.status === 401) {
        authApi.logout();
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchReceivedBookings = async () => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/bookings/received`);

      if (response.ok) {
        const data = await response.json();
        const activeBookings = data.bookings.filter((b: Booking) => b.status !== 'cancelled');
        setReceivedBookings(activeBookings);
      }
    } catch (error) {
      console.error('Error fetching received bookings:', error);
    }
  };

  const openCancelModal = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      setIsCancelling(bookingToCancel);
      setShowCancelModal(false);
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/bookings/${bookingToCancel}/cancel`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setBookings(prevBookings => prevBookings.filter(b => b._id !== bookingToCancel));
        toast('Booking cancelled successfully. The slot is now available.', {
          icon: '❌',
          style: {
            background: '#ef4444',
            color: '#fff',
          },
        });
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const canCancelBooking = (booking: Booking) => {
    // Only allow cancellation of confirmed bookings
    if (booking.status !== 'confirmed') return false;

    // For now, allow cancellation of all confirmed bookings
    // You can add time restrictions later if needed
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const currentBookings = viewMode === 'my-bookings' ? bookings : receivedBookings;
  const isMyBookingsView = viewMode === 'my-bookings';

  if (currentBookings.length === 0 && bookings.length === 0 && receivedBookings.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mb-3">No Bookings Yet</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            You haven't made any bookings yet. Start exploring turfs and book your first space!
          </p>

          <Link href="/" className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all">
            Explore Turfs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pt-20 sm:pt-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-3">Bookings</h1>
          <div className="w-24 h-0.5 bg-emerald-500 mx-auto"></div>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode('my-bookings')}
              className={`px-3 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'my-bookings'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="hidden sm:inline">My Bookings</span>
              <span className="sm:hidden">Mine</span>
              {bookings.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewMode === 'my-bookings' ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  {bookings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('received')}
              className={`px-3 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'received'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Received
              {receivedBookings.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewMode === 'received' ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  {receivedBookings.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {currentBookings.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              {isMyBookingsView ? 'No Bookings Yet' : 'No Received Bookings'}
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {isMyBookingsView
                ? "You haven't made any bookings yet. Start exploring turfs and book your first space!"
                : "You haven't received any bookings for your spaces yet."}
            </p>
            {isMyBookingsView && (
              <Link href="/" className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all">
                Explore Turfs
              </Link>
            )}
          </div>
        )}

        <div className="space-y-6">
          {currentBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-8 pb-4 sm:pb-6 gap-4">
                <div className="flex items-center gap-5">
                  {booking.space?.images?.[0]?.url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={booking.space.images[0].url}
                        alt={booking.space.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-1">{booking.space?.name || 'Unknown Space'}</h3>
                    <p className="text-gray-500 flex items-center gap-1 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {booking.space?.city || 'Unknown City'}, {booking.space?.state || 'Unknown State'}
                    </p>
                    {/* Show booked by in header for received bookings */}
                    {!isMyBookingsView && booking.user && (
                      <p className="text-emerald-600 flex items-center gap-1 text-sm font-medium mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Booked by {booking.user.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2 ${booking.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : booking.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${booking.status === 'confirmed' ? 'bg-emerald-400' :
                      booking.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'
                      }`}></div>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                  <p className="text-2xl font-light text-gray-900">₹{booking.totalAmount}</p>
                </div>
              </div>

              {/* Details */}
              <div className="px-8 pb-6">
                <div className="flex items-center gap-8 text-sm flex-wrap">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-8 0h16l-.5 16H8.5L8 7z" />
                    </svg>
                    <span className="font-medium">{formatDate(booking.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">{booking.duration} hour{booking.duration !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{booking.notes}</p>
                  </div>
                )}

                {/* Show customer contact and email for received bookings */}
                {!isMyBookingsView && booking.user && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 mb-2">Customer Information</p>
                    <div className="space-y-1">
                      <p className="text-sm text-emerald-900">
                        <span className="font-medium">Name:</span> {booking.user.username}
                      </p>
                      <p className="text-sm text-emerald-900">
                        <span className="font-medium">Email:</span> {booking.user.email}
                      </p>
                      {booking.contactNumber && booking.contactNumber !== '0000000000' && (
                        <p className="text-sm text-emerald-900">
                          <span className="font-medium">Contact:</span> {booking.contactNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Booked on {formatTime(booking.createdAt)}
                </p>

                <div className="flex items-center gap-4">
                  {booking.space?._id && (
                    <Link
                      href={`/turf/${booking.space._id}`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View Details
                    </Link>
                  )}

                  {isMyBookingsView && canCancelBooking(booking) && (
                    <button
                      onClick={() => openCancelModal(booking._id)}
                      disabled={isCancelling === booking._id}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      {isCancelling === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to cancel this booking? This action cannot be undone and the slot will become available for others.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
