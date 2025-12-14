'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { authApi } from '../lib/api';
import { useFilters } from '../context/FilterContext';

export default function Navbar() {
  const pathname = usePathname();
  const filters = useFilters();
  const isHomePage = pathname === '/';
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState<{ width: number; left: number; opacity: number }>({ width: 0, left: 0, opacity: 0 });

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const homeRef = useRef<HTMLAnchorElement | null>(null);
  const bookingsRef = useRef<HTMLAnchorElement | null>(null);
  const spacesRef = useRef<HTMLAnchorElement | null>(null);
  const favoritesRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = authApi.getUser();
    if (userData) {
      setUser(userData);
    }
    setIsLoading(false);

    // Listen for user updates
    const handleUserUpdate = () => {
      const updatedUser = authApi.getUser();
      setUser(updatedUser);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  // Smoothly move the green pill to the active link
  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const activeRef =
      pathname === '/'
        ? homeRef.current
        : pathname === '/my-bookings'
        ? bookingsRef.current
        : pathname === '/my-spaces'
        ? spacesRef.current
        : pathname === '/favorites'
        ? favoritesRef.current
        : homeRef.current;

    if (!activeRef) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeRef.getBoundingClientRect();

    const left = activeRect.left - containerRect.left;
    const width = activeRect.width;

    requestAnimationFrame(() => {
      setIndicatorStyle({
        width,
        left,
        opacity: 1,
      });
    });
  }, [pathname]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server call fails, clear client state
      setUser(null);
      window.location.href = '/login';
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/50 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-30 rounded-xl"></div>
              <div className="relative w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent whitespace-nowrap">Sporty Spaces</h1>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {isHomePage ? (
                <>
                  <input
                    type="text"
                    value={filters.searchQuery || ''}
                    onChange={(e) => filters.setSearchQuery(e.target.value)}
                    placeholder="Search for turfs, locations..."
                    className="w-full pl-11 pr-12 py-2.5 bg-slate-50/80 border border-slate-200/50 rounded-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-70 transition-opacity"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </button>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="Search for turfs, locations..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/50 rounded-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  readOnly
                />
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div
            ref={navContainerRef}
            className="hidden md:flex items-center relative bg-slate-100/60 rounded-full px-2 py-1"
          >
            {/* Sliding Background */}
            <div
              className="absolute top-1 left-0 h-[calc(100%-8px)] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-md shadow-emerald-500/25 transition-all duration-400 ease-out"
              style={{
                width: `${indicatorStyle.width}px`,
                transform: `translateX(${indicatorStyle.left}px)`,
                opacity: indicatorStyle.opacity,
              }}
            />

            <Link
              ref={homeRef}
              href="/"
              className={`relative z-10 px-6 h-10 flex items-center justify-center text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-300 ${
                isActive('/') ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </Link>
            <Link
              ref={bookingsRef}
              href="/my-bookings"
              className={`relative z-10 px-6 h-10 flex items-center justify-center text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-300 ${
                isActive('/my-bookings') ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Bookings
            </Link>
            <Link
              ref={spacesRef}
              href="/my-spaces"
              className={`relative z-10 px-6 h-10 flex items-center justify-center text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-300 ${
                isActive('/my-spaces') ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Spaces
            </Link>
            <Link
              ref={favoritesRef}
              href="/favorites"
              className={`relative z-10 px-6 h-10 flex items-center justify-center text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-300 ${
                isActive('/favorites') ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Favorites
            </Link>
          </div>

          {/* User Profile - Desktop */}
          <div className="hidden md:flex items-center justify-end">
            {!isLoading && user && (
              <div className="relative user-dropdown">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50/80 rounded-full transition-all"
                >
                  <span className="hidden lg:block text-sm font-medium text-slate-700 whitespace-nowrap">
                    {user.username}
                  </span>
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40 rounded-full"></div>
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-white shadow-lg">
                      <span className="text-white text-sm font-semibold">
                        {getInitials(user.username)}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 transition-all duration-200 z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border-b border-slate-100">
                      <p className="text-base font-semibold text-slate-900">{user.username}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-2 px-2">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group/item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 text-slate-400 group-hover/item:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group/item mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters Dropdown - Only show on home page */}
        {isHomePage && isFilterOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl shadow-xl border border-slate-200/60 rounded-2xl mx-4 sm:mx-6 lg:mx-8 p-6 z-40">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sport Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sport Type</label>
                <select
                  value={filters.selectedSportType || 'All'}
                  onChange={(e) => filters.setSelectedSportType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                >
                  <option value="All">All Sports</option>
                  {filters.sportTypes?.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <select
                  value={filters.selectedCity || 'All'}
                  onChange={(e) => filters.setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                >
                  <option value="All">All Cities</option>
                  {filters.cities?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.minRating || 0}
                  onChange={(e) => filters.setMinRating(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                >
                  <option value={0}>All Ratings</option>
                  <option value={1}>1+ ⭐</option>
                  <option value={2}>2+ ⭐</option>
                  <option value={3}>3+ ⭐</option>
                  <option value={4}>4+ ⭐</option>
                  <option value={5}>5 ⭐</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Min Price (₹/hr)</label>
                <input
                  type="number"
                  value={filters.priceRange?.min || 0}
                  onChange={(e) => filters.setPriceRange({ ...filters.priceRange!, min: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Max Price (₹/hr)</label>
                <input
                  type="number"
                  value={filters.priceRange?.max || 10000}
                  onChange={(e) => filters.setPriceRange({ ...filters.priceRange!, max: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="10000"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">View Mode</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => filters.setViewMode('grid')}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filters.viewMode === 'grid'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => filters.setViewMode('map')}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filters.viewMode === 'map'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Map
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Filter */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {filters.amenities?.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => {
                      const current = filters.selectedAmenities || [];
                      const updated = current.includes(amenity)
                        ? current.filter(a => a !== amenity)
                        : [...current, amenity];
                      filters.setSelectedAmenities(updated);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (filters.selectedAmenities || []).includes(amenity)
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count and Action Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-emerald-600">{filters.resultsCount || 0}</span> spaces found
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    filters.setSearchQuery('');
                    filters.setSelectedSportType('All');
                    filters.setSelectedCity('All');
                    filters.setPriceRange({ min: 0, max: 10000 });
                    filters.setSelectedAmenities([]);
                    filters.setMinRating(0);
                  }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-xl border-b border-slate-200">
            {/* Mobile Search */}
            {isHomePage && (
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={filters.searchQuery || ''}
                    onChange={(e) => filters.setSearchQuery(e.target.value)}
                    placeholder="Search for turfs..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Filters
                </button>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="py-2 px-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <Link
                href="/my-bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/my-bookings') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Bookings
              </Link>
              <Link
                href="/my-spaces"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/my-spaces') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                My Spaces
              </Link>
              <Link
                href="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/favorites') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favorites
              </Link>
            </div>

            {/* Mobile User Section */}
            {!isLoading && user && (
              <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-emerald-50 rounded-xl">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-white shadow-lg">
                    <span className="text-white text-sm font-semibold">
                      {getInitials(user.username)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
