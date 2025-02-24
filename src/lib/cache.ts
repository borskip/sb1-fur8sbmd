import { Movie, MovieDetails } from './tmdb';

// Cache configuration
const CACHE_CONFIG = {
  localStorage: {
    movieDetails: 'movie-tracker:movie-details',
    searchResults: 'movie-tracker:search-results',
    recommendations: 'movie-tracker:recommendations',
    nowPlaying: 'movie-tracker:now-playing',
    upcoming: 'movie-tracker:upcoming',
    preferences: 'movie-tracker:preferences'
  },
  ttl: {
    movieDetails: 60 * 60 * 1000, // 1 hour
    searchResults: 15 * 60 * 1000, // 15 minutes
    recommendations: 30 * 60 * 1000, // 30 minutes
    nowPlaying: 60 * 60 * 1000, // 1 hour
    upcoming: 60 * 60 * 1000, // 1 hour
    preferences: 24 * 60 * 60 * 1000 // 24 hours
  }
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Cache version - increment when cache structure changes
const CACHE_VERSION = '1.0.0';

// Memory cache for frequently accessed data
const memoryCache = new Map<string, CacheEntry<any>>();

// Helper to check if cache entry is valid
function isValidCache<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
  if (!entry) return false;
  if (entry.version !== CACHE_VERSION) return false;
  return Date.now() - entry.timestamp < ttl;
}

// Helper to create cache key
function createCacheKey(type: string, key: string): string {
  return `${type}:${key}`;
}

// Generic cache get function
async function getCached<T>(
  type: string,
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cacheKey = createCacheKey(type, key);

  // Check memory cache first
  const memEntry = memoryCache.get(cacheKey);
  if (isValidCache(memEntry, ttl)) {
    return memEntry.data;
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry: CacheEntry<T> = JSON.parse(stored);
      if (isValidCache(entry, ttl)) {
        // Update memory cache
        memoryCache.set(cacheKey, entry);
        return entry.data;
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Create cache entry
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION
  };

  // Update both caches
  try {
    memoryCache.set(cacheKey, entry);
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }

  return data;
}

// Cache cleanup
function cleanupCache(): void {
  try {
    // Clear expired items from memory cache
    for (const [key, entry] of memoryCache.entries()) {
      const [type] = key.split(':');
      const ttl = CACHE_CONFIG.ttl[type as keyof typeof CACHE_CONFIG.ttl];
      if (!isValidCache(entry, ttl)) {
        memoryCache.delete(key);
      }
    }

    // Clear expired items from localStorage
    for (const key in localStorage) {
      if (key.startsWith('movie-tracker:')) {
        try {
          const entry: CacheEntry<any> = JSON.parse(localStorage.getItem(key)!);
          const [type] = key.split(':').slice(1);
          const ttl = CACHE_CONFIG.ttl[type as keyof typeof CACHE_CONFIG.ttl];
          if (!isValidCache(entry, ttl)) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
}

// Run cleanup periodically
setInterval(cleanupCache, 5 * 60 * 1000); // Every 5 minutes

// Specific cache functions
export async function getCachedMovieDetails(
  id: number,
  fetchFn: () => Promise<MovieDetails>
): Promise<MovieDetails> {
  return getCached('movieDetails', id.toString(), CACHE_CONFIG.ttl.movieDetails, fetchFn);
}

export async function getCachedSearchResults(
  query: string,
  fetchFn: () => Promise<{ movies: Movie[]; person?: any }>
): Promise<{ movies: Movie[]; person?: any }> {
  return getCached('searchResults', query, CACHE_CONFIG.ttl.searchResults, fetchFn);
}

export async function getCachedRecommendations(
  movieIds: number[],
  fetchFn: () => Promise<Movie[]>
): Promise<Movie[]> {
  const key = movieIds.sort().join(',');
  return getCached('recommendations', key, CACHE_CONFIG.ttl.recommendations, fetchFn);
}

export async function getCachedNowPlaying(
  fetchFn: () => Promise<Movie[]>
): Promise<Movie[]> {
  return getCached('nowPlaying', 'current', CACHE_CONFIG.ttl.nowPlaying, fetchFn);
}

export async function getCachedUpcoming(
  userId: string | undefined,
  fetchFn: () => Promise<Movie[]>
): Promise<Movie[]> {
  const key = userId || 'anonymous';
  return getCached('upcoming', key, CACHE_CONFIG.ttl.upcoming, fetchFn);
}

export async function getCachedPreferences(
  userId: string,
  fetchFn: () => Promise<any>
): Promise<any> {
  return getCached('preferences', userId, CACHE_CONFIG.ttl.preferences, fetchFn);
}

// Function to clear all caches
export function clearAllCaches(): void {
  // Clear memory cache
  memoryCache.clear();

  // Clear localStorage cache
  try {
    for (const key in localStorage) {
      if (key.startsWith('movie-tracker:')) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Error clearing localStorage cache:', error);
  }
}

// Function to clear specific cache
export function clearCache(type: keyof typeof CACHE_CONFIG.localStorage): void {
  const prefix = `movie-tracker:${type}`;
  
  // Clear from memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  // Clear from localStorage
  try {
    for (const key in localStorage) {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn(`Error clearing ${type} cache:`, error);
  }
}