import React from 'react';
import { AdvancedSearch } from '../components/AdvancedSearch';

export function Discover() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Discover Movies</h1>
          <p className="text-gray-600 mt-1">Search movies, actors, directors and more</p>
        </div>
      </div>

      {/* Advanced Search Component */}
      <AdvancedSearch />
    </div>
  );
}