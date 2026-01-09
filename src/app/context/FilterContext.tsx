'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface FilterContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSportType: string;
  setSelectedSportType: (type: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  selectedAmenities: string[];
  setSelectedAmenities: (amenities: string[]) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  viewMode: 'grid' | 'map';
  setViewMode: (mode: 'grid' | 'map') => void;
  sportTypes: string[];
  setSportTypes: (types: string[]) => void;
  cities: string[];
  setCities: (cities: string[]) => void;
  amenities: string[];
  setAmenities: (amenities: string[]) => void;
  resultsCount: number;
  setResultsCount: (count: number) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportType, setSelectedSportType] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [resultsCount, setResultsCount] = useState(0);

  return (
    <FilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedSportType,
        setSelectedSportType,
        selectedCity,
        setSelectedCity,
        priceRange,
        setPriceRange,
        selectedAmenities,
        setSelectedAmenities,
        minRating,
        setMinRating,
        viewMode,
        setViewMode,
        sportTypes,
        setSportTypes,
        cities,
        setCities,
        amenities,
        setAmenities,
        resultsCount,
        setResultsCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
