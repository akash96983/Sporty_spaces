'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api';
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
  images: { url: string }[];
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const authenticated = await authApi.ensureUser();
      if (!authenticated) {
        router.push('/login');
        return;
      }

      loadFavorites();
      fetchSpaces();
    };

    init();
  }, [router]);

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const fetchSpaces = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/spaces`);
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
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

  const favoriteSpaces = spaces.filter(space => favorites.includes(space._id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Favorites</h1>
        <p className="text-slate-600">Spaces you've saved for later</p>
      </div>

      {favoriteSpaces.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No favorites yet</h2>
          <p className="text-slate-500 mb-6">Start exploring and save your favorite spaces</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Browse Spaces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {favoriteSpaces.map((space) => (
            <div key={space._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="relative h-48">
                <img
                  src={space.images[0]?.url || '/placeholder.jpg'}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleFavorite(space._id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  <svg
                    className="w-5 h-5 text-red-500 fill-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{space.name}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{space.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    {space.sportType}
                  </span>
                  <span className="text-lg font-bold text-emerald-600">₹{space.pricePerHour}/hr</span>
                </div>

                <div className="flex items-center text-sm text-slate-500 mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{space.city}, {space.state}</span>
                </div>

                <Link
                  href={`/turf/${space._id}`}
                  className="block w-full text-center py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
