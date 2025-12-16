'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authApi, fetchWithAuth } from './lib/api';
import { useRouter } from 'next/navigation';
import { useFilters } from './context/FilterContext';
import toast from 'react-hot-toast';

interface Space {
  _id: string;
  name: string;
  description: string;
  sportType: string;
  address: string;
  city: string;
  state: string;
  pricePerHour: number;
  images: { url: string; publicId: string }[];
  amenities: string[];
  operatingHours: { opening: string; closing: string };
  capacity?: number;
  isActive: boolean;
}

interface SpaceWithReviews extends Space {
  reviewStats: {
    totalReviews: number;
    avgRating: number;
  } | null;
}

export default function Page() {
  const router = useRouter();
  const filters = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [spaces, setSpaces] = useState<SpaceWithReviews[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<SpaceWithReviews[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filter states are now in context
  const {
    searchQuery,
    selectedSportType,
    priceRange,
    selectedCity,
    selectedAmenities,
    minRating,
    viewMode,
    setSportTypes,
    setCities,
    setAmenities,
    setResultsCount
  } = filters;

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      // Home page is public now. We don't force redirect.
      // Auth state is handled by Navbar.

      fetchSpaces();
      loadFavorites();
    };

    init();

    return () => {
      isActive = false;
    };
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [spaces, searchQuery, selectedSportType, priceRange, selectedCity, selectedAmenities, minRating]);

  // Update context with available options
  useEffect(() => {
    if (spaces.length > 0) {
      setSportTypes(getSportTypes().filter(s => s !== 'All'));
      setCities(getUniqueCities().filter(c => c !== 'All'));
      setAmenities(getAllAmenities());
    }
  }, [spaces]);

  // Update results count
  useEffect(() => {
    setResultsCount(filteredSpaces.length);
  }, [filteredSpaces]);

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (spaceId: string) => {
    const isRemoving = favorites.includes(spaceId);
    const newFavorites = isRemoving
      ? favorites.filter(id => id !== spaceId)
      : [...favorites, spaceId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    if (isRemoving) {
      toast('Removed from favorites', {
        icon: '🗑️',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } else {
      toast.success('Added to favorites');
    }
  };

  const applyFilters = () => {
    let filtered = [...spaces];

    // Search by name or city
    if (searchQuery) {
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport type
    if (selectedSportType !== 'All') {
      filtered = filtered.filter(space => space.sportType === selectedSportType);
    }

    // Filter by price range
    filtered = filtered.filter(space =>
      space.pricePerHour >= priceRange.min && space.pricePerHour <= priceRange.max
    );

    // Filter by city
    if (selectedCity !== 'All') {
      filtered = filtered.filter(space => space.city === selectedCity);
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(space =>
        selectedAmenities.every(amenity => space.amenities.includes(amenity))
      );
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(space =>
        space.reviewStats && space.reviewStats.avgRating >= minRating
      );
    }

    setFilteredSpaces(filtered);
  };

  const getUniqueCities = () => {
    return ['All', ...Array.from(new Set(spaces.map(space => space.city)))];
  };

  const getSportTypes = () => {
    return ['All', ...Array.from(new Set(spaces.map(space => space.sportType)))];
  };

  const getAllAmenities = () => {
    const amenitiesSet = new Set<string>();
    spaces.forEach(space => {
      space.amenities.forEach(amenity => amenitiesSet.add(amenity));
    });
    return Array.from(amenitiesSet);
  };

  const fetchSpaces = async () => {
    try {
      const API_URL = '/api';
      const response = await fetchWithAuth(`${API_URL}/spaces`);

      if (!response.ok) {
        if (response.status === 401) {
          authApi.logout();
          router.push('/login');
          return;
        }
        console.error('Failed to fetch spaces:', response.status);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Fetched', data.spaces?.length || 0, 'spaces');

      // Fetch review stats for each space
      const spacesWithReviews = await Promise.all(
        data.spaces.map(async (space: Space) => {
          try {
            const API_URL = '/api';
            const reviewResponse = await fetch(`${API_URL}/reviews/${space._id}`);
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              return {
                ...space,
                reviewStats: {
                  totalReviews: reviewData.stats.totalReviews,
                  avgRating: reviewData.stats.avgRating
                }
              };
            }
            return { ...space, reviewStats: null };
          } catch (error) {
            return { ...space, reviewStats: null };
          }
        })
      );

      setSpaces(spacesWithReviews);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pt-20 sm:pt-24">
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No spaces found. Try adjusting your filters.</p>
            <p className="text-gray-400 text-sm mt-2">Total spaces loaded: {spaces.length}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSpaces.map((space) => (
              <div key={space._id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-emerald-200 transform hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-52 bg-gradient-to-br from-emerald-400 to-emerald-600 overflow-hidden">
                  {space.images && space.images.length > 0 ? (
                    <img
                      src={space.images[0].url}
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(space._id)}
                    className="absolute top-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <svg
                      className={`w-5 h-5 ${favorites.includes(space._id) ? 'text-red-500 fill-red-500' : 'text-slate-400'}`}
                      fill={favorites.includes(space._id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                    <div className={`flex items-center gap-2 ${space.isActive ? 'text-emerald-700' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${space.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {space.isActive ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">{space.name}</h3>
                    <div className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md">
                      {space.sportType}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    {space.reviewStats && space.reviewStats.totalReviews > 0 ? (
                      <>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= Math.round(space.reviewStats!.avgRating) ? 'text-amber-400' : 'text-slate-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {space.reviewStats.avgRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({space.reviewStats.totalReviews} review{space.reviewStats.totalReviews !== 1 ? 's' : ''})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">No reviews yet</span>
                    )}
                  </div>

                  {/* Location and Features */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{space.city}, {space.state}</span>
                    </div>

                    {space.capacity && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">{space.capacity} players</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-700">{space.operatingHours.opening} - {space.operatingHours.closing}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price and Book Button */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">₹{space.pricePerHour}</span>
                        <span className="text-sm text-slate-500 font-medium">/hour</span>
                      </div>
                      <span className="text-xs text-slate-400">Starting price</span>
                    </div>
                    <Link
                      href={`/turf/${space._id}`}
                      className="group px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-200"
                    >
                      <span className="flex items-center gap-2">
                        View Details
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Map View Coming Soon</h3>
              <p className="text-slate-500">We're working on an interactive map to help you find nearby sports venues</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}