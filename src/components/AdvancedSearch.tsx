import React, { useState, useEffect } from 'react';
import { Search, Filter, X, User, Film, Calendar, Star, Zap, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies, searchPeople, getMoviesByGenre, getMoviesByYear, getPopularMovies } from '../lib/tmdb';
import { MovieCard } from './MovieCard';
import { PersonCard } from './PersonCard';
import { useDebouncedCallback } from 'use-debounce';
import type { Movie } from '../lib/tmdb';

interface SearchResult {
  movies: Movie[];
  people: any[];
  totalResults: number;
  searchType: string;
}

export function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'movies' | 'people' | 'genre' | 'year'>('all');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const debouncedSearch = useDebouncedCallback(setQuery, 300);

  // Popular movies for initial state
  const { data: popularMovies } = useQuery({
    queryKey: ['popularMovies'],
    queryFn: getPopularMovies,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Main search query
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['advancedSearch', query, searchType, selectedGenre, selectedYear],
    queryFn: async (): Promise<SearchResult> => {
      // If no query and no filters, return popular movies
      if (!query && !selectedGenre && !selectedYear) {
        return {
          movies: popularMovies || [],
          people: [],
          totalResults: popularMovies?.length || 0,
          searchType: 'popular'
        };
      }

      let movies: Movie[] = [];
      let people: any[] = [];

      try {
        switch (searchType) {
          case 'movies':
            if (query) {
              const movieResults = await searchMovies(query);
              movies = movieResults.movies;
            }
            break;

          case 'people':
            if (query) {
              const peopleResults = await searchPeople(query);
              people = peopleResults.results || [];
              // Get movies for the first person found
              if (people.length > 0) {
                const personMovies = await getMoviesByPerson(people[0].id);
                movies = personMovies;
              }
            }
            break;

          case 'genre':
            if (selectedGenre) {
              movies = await getMoviesByGenre(selectedGenre);
            }
            break;

          case 'year':
            if (selectedYear) {
              movies = await getMoviesByYear(parseInt(selectedYear));
            }
            break;

          default: // 'all'
            if (query) {
              const [movieResults, peopleResults] = await Promise.all([
                searchMovies(query),
                searchPeople(query)
              ]);
              
              movies = movieResults.movies;
              people = peopleResults.results || [];

              // If we found people, also get their movies
              if (people.length > 0 && movies.length < 10) {
                const personMovies = await getMoviesByPerson(people[0].id);
                // Merge and deduplicate
                const movieIds = new Set(movies.map(m => m.id));
                const newMovies = personMovies.filter(m => !movieIds.has(m.id));
                movies = [...movies, ...newMovies].slice(0, 20);
              }
            }
            break;
        }

        return {
          movies: movies.slice(0, 20),
          people: people.slice(0, 10),
          totalResults: movies.length + people.length,
          searchType
        };
      } catch (error) {
        console.error('Search error:', error);
        return {
          movies: [],
          people: [],
          totalResults: 0,
          searchType
        };
      }
    },
    enabled: Boolean(query || selectedGenre || selectedYear || popularMovies),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleClearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSearchType('all');
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'movies': return <Film className="w-4 h-4" />;
      case 'people': return <User className="w-4 h-4" />;
      case 'genre': return <Filter className="w-4 h-4" />;
      case 'year': return <Calendar className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getResultsTitle = () => {
    if (!searchResults) return '';
    
    if (searchResults.searchType === 'popular') {
      return 'Popular Movies';
    }
    
    if (query) {
      return `Search results for "${query}"`;
    }
    
    if (selectedGenre) {
      const genre = genres.find(g => g.id.toString() === selectedGenre);
      return `${genre?.name} Movies`;
    }
    
    if (selectedYear) {
      return `Movies from ${selectedYear}`;
    }
    
    return 'Search Results';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              onChange={(e) => debouncedSearch(e.target.value)}
              placeholder="Search movies, actors, directors..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'all', label: 'All', icon: Search },
            { id: 'movies', label: 'Movies', icon: Film },
            { id: 'people', label: 'People', icon: User },
            { id: 'genre', label: 'Genre', icon: Filter },
            { id: 'year', label: 'Year', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSearchType(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    if (e.target.value) setSearchType('genre');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    if (e.target.value) setSearchType('year');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(query || selectedGenre || selectedYear) && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              {getSearchTypeIcon(searchResults?.searchType || 'all')}
              <span>{getResultsTitle()}</span>
            </h2>
            {searchResults && searchResults.totalResults > 0 && (
              <span className="text-sm text-gray-500">
                {searchResults.totalResults} results
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Something went wrong. Please try again.</p>
            </div>
          ) : searchResults ? (
            <div className="space-y-8">
              {/* People Results */}
              {searchResults.people.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>People</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {searchResults.people.map(person => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onClick={() => {
                          // Search for movies by this person
                          debouncedSearch(person.name);
                          setSearchType('people');
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Movies Results */}
              {searchResults.movies.length > 0 && (
                <div>
                  {searchResults.people.length > 0 && (
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Film className="w-5 h-5" />
                      <span>Movies</span>
                    </h3>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {searchResults.movies.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => setSelectedMovie(movie)}
                        showQuickActions={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchResults.movies.length === 0 && searchResults.people.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

// Helper function to get movies by person
async function getMoviesByPerson(personId: number): Promise<Movie[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    );
    const data = await response.json();
    
    // Combine cast and crew, remove duplicates, sort by popularity
    const allMovies = [...(data.cast || []), ...(data.crew || [])]
      .filter((movie: any) => movie.poster_path && movie.release_date)
      .reduce((acc: any[], movie: any) => {
        if (!acc.find(m => m.id === movie.id)) {
          acc.push(movie);
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => b.popularity - a.popularity);
    
    return allMovies.slice(0, 20);
  } catch (error) {
    console.error('Error fetching person movies:', error);
    return [];
  }
}