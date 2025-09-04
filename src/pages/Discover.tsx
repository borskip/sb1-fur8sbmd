import React, { useState } from 'react';
import { AdvancedSearch } from '../components/AdvancedSearch';

export function Discover() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Movies</h1>
          <p className="text-gray-600 mt-1">Search movies, actors, directors and more</p>
        </div>
      </div>

      {/* Advanced Search Component */}
      <AdvancedSearch />
    </div>
  );
}