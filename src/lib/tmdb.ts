import { z } from 'zod';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const OMDB_API_KEY = '251fbee5';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function getCacheKey(url: string): string {
  return url;
}

async function fetchWithCache<T>(url: string): Promise<T> {
  const cacheKey = getCacheKey(url);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  imdb_id?: string;
  director?: string;
  actors?: string;
  awards?: string;
  boxOffice?: string;
  rated?: string;
  imdbRating?: string;
  metascore?: string;
  rottenTomatoesRating?: string;
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  imdb_id: string;
  videos: {
    results: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
}

export interface TVShowDetails extends TVShow {
  genres: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string; logo_path: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  videos: {
    results: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  };
}

// Enhanced movie details with OMDB data
async function getOMDBData(imdbId: string): Promise<any> {
  try {
    const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
    const data = await fetchWithCache(url);
    
    if (data.Response === 'False') {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('OMDB fetch failed:', error);
    return null;
  }
}

export async function searchMovies(query: string): Promise<{ movies: Movie[]; person?: any }> {
  try {
    // Search for movies
    const movieUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const movieData = await fetchWithCache(movieUrl);
    
    // Search for people
    const personUrl = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const personData = await fetchWithCache(personUrl);
    
    let movies = movieData.results || [];
    let person = null;
    
    // If we found a person, get their movies
    if (personData.results?.length > 0) {
      person = personData.results[0];
      const personMoviesUrl = `${TMDB_BASE_URL}/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}`;
      const personMovies = await fetchWithCache(personMoviesUrl);
      
      // Combine cast and crew, remove duplicates, sort by popularity
      const allMovies = [...(personMovies.cast || []), ...(personMovies.crew || [])]
        .filter((movie: any) => movie.poster_path && movie.release_date)
        .reduce((acc: any[], movie: any) => {
          if (!acc.find(m => m.id === movie.id)) {
            acc.push(movie);
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => b.popularity - a.popularity)
        .slice(0, 20);
      
      movies = allMovies;
    }
    
    return { movies, person };
  } catch (error) {
    console.error('Search failed:', error);
    return { movies: [] };
  }
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  try {
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
    const tmdbData = await fetchWithCache(url);
    
    // Get additional data from OMDB if we have an IMDB ID
    if (tmdbData.imdb_id) {
      const omdbData = await getOMDBData(tmdbData.imdb_id);
      
      if (omdbData) {
        // Extract Rotten Tomatoes rating
        const rtRating = omdbData.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value;
        
        return {
          ...tmdbData,
          director: omdbData.Director,
          actors: omdbData.Actors,
          awards: omdbData.Awards,
          boxOffice: omdbData.BoxOffice,
          rated: omdbData.Rated,
          imdbRating: omdbData.imdbRating,
          metascore: omdbData.Metascore,
          rottenTomatoesRating: rtRating
        };
      }
    }
    
    return tmdbData;
  } catch (error) {
    console.error('Failed to get movie details:', error);
    throw error;
  }
}

export async function getTVShowDetails(id: number): Promise<TVShowDetails> {
  try {
    const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
    return await fetchWithCache(url);
  } catch (error) {
    console.error('Failed to get TV show details:', error);
    throw error;
  }
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&region=NL`;
    const data = await fetchWithCache(url);
    return data.results || [];
  } catch (error) {
    console.error('Failed to get now playing movies:', error);
    return [];
  }
}

export async function getUpcomingMovies(): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&region=NL`;
    const data = await fetchWithCache(url);
    
    // Filter to next 3 months
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    return (data.results || []).filter((movie: Movie) => {
      const releaseDate = new Date(movie.release_date);
      return releaseDate <= threeMonthsFromNow;
    });
  } catch (error) {
    console.error('Failed to get upcoming movies:', error);
    return [];
  }
}

export async function getMostAnticipatedMovies(): Promise<Movie[]> {
  try {
    const currentYear = new Date().getFullYear();
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${currentYear}&sort_by=vote_count.desc&vote_average.gte=7`;
    const data = await fetchWithCache(url);
    return (data.results || []).slice(0, 20);
  } catch (error) {
    console.error('Failed to get anticipated movies:', error);
    return [];
  }
}

export async function getRecommendedMovies(
  favoriteMovieIds: number[],
  excludeMovieIds: number[] = []
): Promise<Movie[]> {
  if (!favoriteMovieIds.length) return [];

  try {
    // Get recommendations for each favorite movie
    const recommendationPromises = favoriteMovieIds.slice(0, 5).map(async (id) => {
      const url = `${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${TMDB_API_KEY}`;
      const data = await fetchWithCache(url);
      return data.results || [];
    });

    const allRecommendations = await Promise.all(recommendationPromises);
    
    // Flatten, deduplicate, and filter
    const uniqueMovies = new Map<number, Movie>();
    allRecommendations.flat().forEach((movie: Movie) => {
      if (!uniqueMovies.has(movie.id) && !excludeMovieIds.includes(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
    });

    return Array.from(uniqueMovies.values())
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 12);
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}

export async function searchPeople(query: string): Promise<{ results: any[] }> {
  try {
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const data = await fetchWithCache(url);
    return data;
  } catch (error) {
    console.error('People search failed:', error);
    return { results: [] };
  }
}

export async function getMoviesByGenre(genreId: string): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
    const data = await fetchWithCache(url);
    return data.results || [];
  } catch (error) {
    console.error('Genre search failed:', error);
    return [];
  }
}

export async function getMoviesByYear(year: number): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year}&sort_by=popularity.desc`;
    const data = await fetchWithCache(url);
    return data.results || [];
  } catch (error) {
    console.error('Year search failed:', error);
    return [];
  }
}

export async function getPopularMovies(): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`;
    const data = await fetchWithCache(url);
    return data.results || [];
  } catch (error) {
    console.error('Failed to get popular movies:', error);
    return [];
  }
}

export async function getPersonMovies(personId: number): Promise<Movie[]> {
  try {
    const url = `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`;
    const data = await fetchWithCache(url);
    
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
    console.error('Failed to get person movies:', error);
    return [];
  }
}