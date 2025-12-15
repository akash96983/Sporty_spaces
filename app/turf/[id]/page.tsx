'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authApi, fetchWithAuth } from '../../lib/api';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Space {
  _id: string;
  name: string;
  description: string;
  sportType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pricePerHour: number;
  images: { url: string; publicId: string }[];
  amenities: string[];
  operatingHours: { opening: string; closing: string };
  size?: string;
  surfaceType?: string;
  capacity?: number;
  contactNumber?: string;
  isActive: boolean;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default function TurfDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [space, setSpace] = useState<Space | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    contactNumber: '',
    notes: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

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
      if (params.id) {
        fetchSpaceDetails(params.id as string);
        fetchReviews(params.id as string);
      }
    };

    init();

    return () => {
      isActive = false;
    };
  }, [router, params.id]);

  useEffect(() => {
    if (params.id && selectedDate) {
      fetchBookedSlots(params.id as string, selectedDate);
    }
  }, [params.id, selectedDate]);

  const fetchSpaceDetails = async (id: string) => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/spaces/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSpace(data.space);
      }
    } catch (error) {
      console.error('Error fetching space details:', error);
    }
  };

  const fetchReviews = async (spaceId: string) => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/reviews/${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setReviewStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchBookedSlots = async (spaceId: string, date: string) => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/bookings/check-availability/${spaceId}?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        const bookedTimeSlots = data.bookedSlots.map((slot: any) => `${slot.startTime} - ${slot.endTime}`);
        setBookedSlots(bookedTimeSlots);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    }
  };

  const submitReview = async () => {
    try {
      if (!space?._id) {
        toast.error('Unable to identify this turf for review. Please refresh and try again.');
        return;
      }

      if (!newReview.comment.trim()) {
        toast.error('Please add a comment before submitting your review.');
        return;
      }

      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          spaceId: space._id,
          rating: newReview.rating,
          comment: newReview.comment.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowReviewModal(false);
        setNewReview({ rating: 5, comment: '' });
        toast.success('Review submitted successfully!');
        // Refresh reviews
        if (space?._id) {
          fetchReviews(space._id);
        }
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error details:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  };

  if (isLoading || !space) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // Use real images from backend or fallback to placeholder
  const images = space.images && space.images.length > 0
    ? space.images
    : [{ url: '', publicId: '' }];

  const amenityIcons: { [key: string]: string } = {
    'Parking': 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
    'Changing Room': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    'Washrooms': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    'First Aid': 'M12 4v16m8-8H4',
    'Drinking Water': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    'Floodlights': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  };

  const getAmenityIcon = (amenity: string) => {
    return amenityIcons[amenity] || 'M5 13l4 4L19 7';
  };

  // Generate time slots based on operating hours
  const generateTimeSlots = (opening: string, closing: string) => {
    const slots: string[] = [];

    // Convert time strings to 24-hour format for easier calculation
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      return hours;
    };

    const formatTime = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    };

    const startHour = parseTime(opening);
    let endHour = parseTime(closing);

    // Handle overnight hours (e.g., 21:00 to 03:00)
    if (endHour <= startHour) {
      endHour += 24; // Add 24 hours to handle next day
    }

    // Generate hourly slots
    let currentHour = startHour;

    while (currentHour < endHour) {
      const nextHour = currentHour + 1;
      const displayCurrentHour = currentHour >= 24 ? currentHour - 24 : currentHour;
      const displayNextHour = nextHour >= 24 ? nextHour - 24 : nextHour;

      const slotStart = formatTime(displayCurrentHour);
      const slotEnd = formatTime(displayNextHour);
      slots.push(`${slotStart} - ${slotEnd}`);
      currentHour++;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots(space.operatingHours.opening, space.operatingHours.closing);

  // Get current date and time
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentHour = now.getHours();

  // Check if a time slot is in the past or already booked
  const isSlotDisabled = (slot: string) => {
    if (!selectedDate) return false;

    // Check if slot is already booked
    if (bookedSlots.includes(slot)) return true;

    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date(today);

    // If selected date is in the past, disable all slots
    if (selectedDateObj < todayObj) return true;

    // If selected date is today, check if slot time has passed
    if (selectedDate === today) {
      const slotStartTime = slot.split(' - ')[0];
      const slotHour = parseTime(slotStartTime);
      // Only disable if the slot has already passed (not if it's the current hour)
      return slotHour < currentHour;
    }

    return false;
  };

  // Parse time string to hour number (same as in generateTimeSlots)
  const parseTime = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    let [hours] = time.split(':').map(Number);

    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get first letter of username for avatar
  const getAvatar = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const handleTimeSlotClick = (slot: string) => {
    if (isSlotDisabled(slot)) return;
    setSelectedTimeSlot(slot);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    try {
      if (!selectedTimeSlot) {
        toast.error('Please select a time slot');
        return;
      }

      setIsBooking(true);

      const [startTime, endTime] = selectedTimeSlot.split(' - ');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetchWithAuth(`${API_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          spaceId: space?._id,
          date: selectedDate,
          startTime,
          endTime,
          contactNumber: '0000000000',
          notes: ''
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Booking confirmed successfully! Redirecting...');
        setShowBookingModal(false);
        setSelectedTimeSlot('');
        if (params.id) {
          fetchBookedSlots(params.id as string, selectedDate);
        }
        setTimeout(() => {
          router.push('/my-bookings');
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const amenities = [
    { name: 'Parking', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Changing Room', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Washrooms', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'First Aid', icon: 'M12 4v16m8-8H4' },
    { name: 'Drinking Water', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { name: 'Floodlights', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  ];

  const avgRating = reviewStats?.avgRating || 0;
  const totalReviews = reviewStats?.totalReviews || 0;

  return (
    <>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto lg:px-8 py-8 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900  group">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to listings
            </Link>

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-4">
              {/* Main Image */}
              <div className="relative h-96 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl overflow-hidden mb-4">
                {images[selectedImage].url ? (
                  <img
                    src={images[selectedImage].url}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-32 h-32 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg overflow-hidden transition-all ${selectedImage === index ? 'ring-2 ring-emerald-500 ring-offset-2' : 'hover:opacity-80'
                        }`}
                    >
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`${space.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Turf Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{space.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-5 h-5 ${star <= Math.floor(avgRating) ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-lg font-semibold text-slate-700">{avgRating}</span>
                <span className="text-slate-500">({totalReviews} reviews)</span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-slate-600 mb-6">
                <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium text-slate-900">{space.city}, {space.state}</p>
                  <p className="text-sm">{space.address}, {space.pincode}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">About this turf</h2>
                <p className="text-slate-600 leading-relaxed">
                  {space.description}
                </p>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {space.size && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <div>
                      <p className="text-xs text-slate-500">Size</p>
                      <p className="font-semibold text-slate-900">{space.size}</p>
                    </div>
                  </div>
                )}
                {space.capacity && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-slate-500">Capacity</p>
                      <p className="font-semibold text-slate-900">{space.capacity} players</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-slate-500">Opening Hours</p>
                    <p className="font-semibold text-slate-900">{space.operatingHours.opening} - {space.operatingHours.closing}</p>
                  </div>
                </div>
                {space.surfaceType && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-slate-500">Surface</p>
                      <p className="font-semibold text-slate-900">{space.surfaceType}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {space.amenities && space.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {space.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getAmenityIcon(amenity)} />
                        </svg>
                        <span className="text-sm font-medium text-slate-900">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Write a Review
                </button>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-8 p-6 bg-slate-50 rounded-xl mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-2">{avgRating}</div>
                  <div className="flex items-center justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= Math.floor(avgRating) ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-slate-500">{totalReviews} reviews</div>
                </div>

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats?.ratingCounts[rating as keyof typeof reviewStats.ratingCounts] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-8">{rating}★</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-500 w-10">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No reviews yet. Be the first to review this space!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">{getAvatar(review.user.username)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900">{review.user.username}</h4>
                              <p className="text-sm text-slate-500">{formatDate(review.createdAt)}</p>
                            </div>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 sticky top-24 w-full">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900">₹{space.pricePerHour}</span>
                  <span className="text-slate-500">/hour</span>
                </div>
                <p className="text-sm text-emerald-600 font-medium">
                  {space.isActive ? 'Available Now' : 'Currently Unavailable'}
                </p>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Time Slot</label>
                {timeSlots.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => {
                        const disabled = isSlotDisabled(slot);
                        return (
                          <button
                            key={slot}
                            disabled={disabled}
                            onClick={() => handleTimeSlotClick(slot)}
                            className={`px-2 py-1.5 text-xs font-medium border rounded-md transition-all ${disabled
                                ? bookedSlots.includes(slot)
                                  ? 'text-red-400 border-red-200 bg-red-50 cursor-not-allowed'
                                  : 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                          >
                            {slot} {bookedSlots.includes(slot) ? '(Booked)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-4">No time slots available for the current operating hours.</p>
                )}
              </div>

              {/* Book Button */}
              <div className="text-center text-sm text-slate-500 mb-4">
                Click on a time slot above to book
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Write a Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Rating Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="transition-colors"
                  >
                    <svg
                      className={`w-8 h-8 ${star <= newReview.rating ? 'text-amber-400' : 'text-slate-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-600">({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})</span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">{newReview.comment.length}/500 characters</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={!newReview.comment.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Confirm Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Booking Details */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">{space?.name}</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p><span className="font-medium">Date:</span> {formatDate(selectedDate)}</p>
                <p><span className="font-medium">Time:</span> {selectedTimeSlot}</p>
                <p><span className="font-medium">Duration:</span> 1 hour</p>
                <p><span className="font-medium">Total Amount:</span> ₹{space?.pricePerHour}</p>
              </div>
            </div>



            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isBooking}
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
