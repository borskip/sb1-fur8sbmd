import { z } from 'zod';
import { supabase } from './supabase';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const OMDB_API_KEY = '251fbee5';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Cache for OMDB responses
const omdbCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Art house / independent film companies
const ARTHOUSE_COMPANIES = [
  '194', // A24
  '43', // IFC Films
  '138', // Focus Features
  '583', // Magnolia Pictures
  '5551', // Neon
  '11444', // Sony Pictures Classics
  '6574', // Bleecker Street
  '12177', // Searchlight Pictures
];

// Validation schemas
const omdbResponseSchema = z.object({
  Response: z.string(),
  Error: z.string().optional(),
  imdbRating: z.string().optional(),
  Metascore: z.string().optional(),
  Ratings: z.array(z.object({
    Source: z.string(),
    Value: z.string()
  })).optional(),
  Director: z.string().optional(),
  Writer: z.string().optional(),
  Actors: z.string().optional(),
  Awards: z.string().optional(),
  BoxOffice: z.string().optional(),
  Rated: z.string().optional(),
  Production: z.string().optional()
});

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  imdb_id?: string;
  genre_ids?: number[];
  vote_average?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string }>;
}

export interface MovieDetails extends Movie {
  vote_average: number;
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
  // OMDB specific fields
  imdbRating?: string;
  metascore?: string;
  rottenTomatoesRating?: string;
  director?: string;
  writer?: string;
  actors?: string;
  awards?: string;
  boxOffice?: string;
  rated?: string;
  production?: string;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  overview: string;
  first_air_date: string;
  genre_ids?: number[];
  vote_average?: number;
  genres?: Array<{ id: number; name: string }>;
  networks?: Array<{ id: number; name: string; logo_path: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  };
  last_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  };
}

export interface TVShowDetails extends TVShow {
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string; logo_path: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  created_by: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  seasons: Array<{
    id: number;
    name: string;
    episode_count: number;
    season_number: number;
    air_date: string | null;
    overview: string;
    poster_path: string | null;
  }>;
  videos: {
    results: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
}

interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: Array<Movie | TVShow>;
}

async function fetchAllPages(url: string, maxPages = 3): Promise<any[]> {
  const allResults: any[] = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${url}${url.includes('?') ? '&' : '?'}page=${page}`;
    const response = await fetch(pageUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    allResults.push(...data.results);
    
    // Stop if we've reached the last page
    if (page >= data.total_pages) break;
  }
  
  return allResults;
}

async function fetchOMDBData(imdbId: string): Promise<z.infer<typeof omdbResponseSchema> | null> {
  try {
    // Check cache first
    const cached = omdbCache.get(imdbId);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) { // 1 hour cache
      return cached.data;
    }

    // Fetch directly from OMDB with API key
    const response = await fetch(`${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Movie not found
      }
      throw new Error(`OMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = omdbResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('OMDB data validation error:', parsed.error);
      return null;
    }

    if (parsed.data.Response === 'False') {
      return null;
    }

    // Cache the successful response
    omdbCache.set(imdbId, {
      data: parsed.data,
      timestamp: Date.now()
    });

    return parsed.data;
  } catch (error) {
    console.error('Failed to fetch OMDB data:', error);
    return null;
  }
}

export async function searchMovies(query: string): Promise<{ movies: Movie[]; person?: Person }> {
  // First try to find a person (actor/director)
  const people = await searchPeople(query);
  const relevantPerson = people.find(person => 
    person.known_for_department === 'Acting' || 
    person.known_for_department === 'Directing'
  );

  if (relevantPerson) {
    // Get person's movies with full details
    const personMovies = await getPersonMovies(relevantPerson.id);
    return { 
      movies: personMovies,
      person: relevantPerson
    };
  }

  // If no person found, search for movies
  const movies = await fetchAllPages(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );

  // Get full details for each movie
  const moviesWithDetails = await Promise.all(
    movies.slice(0, 20).map(async (movie) => {
      try {
        return await getMovieDetails(movie.id);
      } catch (error) {
        console.error(`Failed to get details for movie ${movie.id}:`, error);
        return movie;
      }
    })
  );

  return { movies: moviesWithDetails };
}

export async function searchTVShows(query: string): Promise<{ shows: TVShow[]; person?: Person }> {
  // First try to find a person (actor/creator)
  const people = await searchPeople(query);
  const relevantPerson = people.find(person => 
    person.known_for_department === 'Acting' || 
    person.known_for_department === 'Writing'
  );

  if (relevantPerson) {
    // Get person's TV shows with full details
    const personShows = await getPersonTVShows(relevantPerson.id);
    return { 
      shows: personShows,
      person: relevantPerson
    };
  }

  // If no person found, search for TV shows
  const shows = await fetchAllPages(
    `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );

  // Get full details for each show
  const showsWithDetails = await Promise.all(
    shows.slice(0, 20).map(async (show) => {
      try {
        return await getTVShowDetails(show.id);
      } catch (error) {
        console.error(`Failed to get details for TV show ${show.id}:`, error);
        return show;
      }
    })
  );

  return { shows: showsWithDetails };
}

export async function searchPeople(query: string): Promise<Person[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
  );
  const data = await response.json();
  return data.results;
}

export async function getPersonMovies(personId: number): Promise<Movie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`
  );
  const data = await response.json();
  
  // Combine cast and crew roles, sort by release date
  const movies = [...data.cast, ...data.crew]
    .filter((movie: any) => movie.release_date && movie.poster_path) // Only include movies with release dates and posters
    .sort((a: any, b: any) => {
      const dateA = new Date(a.release_date);
      const dateB = new Date(b.release_date);
      return dateB.getTime() - dateA.getTime(); // Sort newest to oldest
    });

  // Remove duplicates (same movie might appear in both cast and crew)
  const uniqueMovies = Array.from(
    new Map(movies.map((movie: any) => [movie.id, movie])).values()
  );

  // Get full details for each movie
  const moviesWithDetails = await Promise.all(
    uniqueMovies.slice(0, 20).map(async (movie: any) => {
      try {
        return await getMovieDetails(movie.id);
      } catch (error) {
        console.error(`Failed to get details for movie ${movie.id}:`, error);
        return movie;
      }
    })
  );

  return moviesWithDetails;
}

export async function getPersonTVShows(personId: number): Promise<TVShow[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/tv_credits?api_key=${TMDB_API_KEY}`
  );
  const data = await response.json();
  
  // Combine cast and crew roles, sort by first air date
  const shows = [...data.cast, ...data.crew]
    .filter((show: any) => show.first_air_date && show.poster_path)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.first_air_date);
      const dateB = new Date(b.first_air_date);
      return dateB.getTime() - dateA.getTime();
    });

  // Remove duplicates
  const uniqueShows = Array.from(
    new Map(shows.map((show: any) => [show.id, show])).values()
  );

  // Get full details for each show
  const showsWithDetails = await Promise.all(
    uniqueShows.slice(0, 20).map(async (show: any) => {
      try {
        return await getTVShowDetails(show.id);
      } catch (error) {
        console.error(`Failed to get details for TV show ${show.id}:`, error);
        return show;
      }
    })
  );

  return showsWithDetails;
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  // First get TMDB details
  const tmdbResponse = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`
  );
  
  if (!tmdbResponse.ok) {
    throw new Error(`TMDB API error: ${tmdbResponse.status}`);
  }
  
  const tmdbData = await tmdbResponse.json();

  // If we have an IMDB ID, get additional data from OMDB
  if (tmdbData.imdb_id) {
    const omdbData = await fetchOMDBData(tmdbData.imdb_id);

    if (omdbData) {
      // Extract Rotten Tomatoes rating if available
      const rottenTomatoesRating = omdbData.Ratings?.find(
        r => r.Source === 'Rotten Tomatoes'
      )?.Value;

      // Extract Metacritic rating if available
      const metascore = omdbData.Ratings?.find(
        r => r.Source === 'Metacritic'
      )?.Value?.split('/')[0];

      return {
        ...tmdbData,
        imdbRating: omdbData.imdbRating,
        metascore: metascore || omdbData.Metascore,
        rottenTomatoesRating,
        director: omdbData.Director,
        writer: omdbData.Writer,
        actors: omdbData.Actors,
        awards: omdbData.Awards,
        boxOffice: omdbData.BoxOffice,
        rated: omdbData.Rated,
        production: omdbData.Production
      };
    }
  }

  return tmdbData;
}

export async function getTVShowDetails(id: number): Promise<TVShowDetails> {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,external_ids`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

export async function getRecommendedMovies(
  movieIds: number[],
  excludeMovieIds: number[] = []
): Promise<Movie[]> {
  if (!movieIds.length) return [];

  try {
    // Get recommendations for each movie
    const recommendationPromises = movieIds.map(async (id) => {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${TMDB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get recommendations for movie ${id}`);
      }
      
      const data = await response.json();
      return data.results || [];
    });

    const allRecommendations = await Promise.all(recommendationPromises);
    
    // Flatten and deduplicate recommendations, excluding movies in excludeMovieIds
    const uniqueMovies = new Map<number, Movie>();
    allRecommendations.flat().forEach(movie => {
      if (!uniqueMovies.has(movie.id) && !excludeMovieIds.includes(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
    });

    // Convert to array and get full details for each movie
    const movies = Array.from(uniqueMovies.values());
    const moviesWithDetails = await Promise.all(
      movies.map(async (movie) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (error) {
          console.error(`Failed to get details for movie ${movie.id}:`, error);
          return movie;
        }
      })
    );

    // Sort by vote average and limit to 12 movies
    return moviesWithDetails
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 12);
  } catch (error) {
    console.error('Failed to get recommended movies:', error);
    throw error;
  }
}

export async function getRecommendedTVShows(
  showIds: number[],
  excludeShowIds: number[] = []
): Promise<TVShow[]> {
  if (!showIds.length) return [];

  try {
    // Get recommendations for each show
    const recommendationPromises = showIds.map(async (id) => {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/recommendations?api_key=${TMDB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get recommendations for TV show ${id}`);
      }
      
      const data = await response.json();
      return data.results || [];
    });

    const allRecommendations = await Promise.all(recommendationPromises);
    
    // Flatten and deduplicate recommendations
    const uniqueShows = new Map<number, TVShow>();
    allRecommendations.flat().forEach(show => {
      if (!uniqueShows.has(show.id) && !excludeShowIds.includes(show.id)) {
        uniqueShows.set(show.id, show);
      }
    });

    // Convert to array and get full details for each show
    const shows = Array.from(uniqueShows.values());
    const showsWithDetails = await Promise.all(
      shows.map(async (show) => {
        try {
          return await getTVShowDetails(show.id);
        } catch (error) {
          console.error(`Failed to get details for TV show ${show.id}:`, error);
          return show;
        }
      })
    );

    // Sort by vote average and limit to 12 shows
    return showsWithDetails
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 12);
  } catch (error) {
    console.error('Failed to get recommended TV shows:', error);
    throw error;
  }
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  try {
    const movies = await fetchAllPages(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=nl-NL&region=NL`
    );
    
    // Get full details for each movie to include runtime and genres
    const moviesWithDetails = await Promise.all(
      movies.map(async (movie: Movie) => {
        try {
          const details = await getMovieDetails(movie.id);
          return {
            ...movie,
            runtime: details.runtime,
            genres: details.genres
          };
        } catch (error) {
          console.error(`Failed to get details for movie ${movie.id}:`, error);
          return movie;
        }
      })
    );

    return moviesWithDetails;
  } catch (error) {
    console.error('Failed to get now playing movies:', error);
    throw error;
  }
}

export async function getAiringTodayTVShows(): Promise<TVShow[]> {
  try {
    const shows = await fetchAllPages(
      `${TMDB_BASE_URL}/tv/airing_today?api_key=${TMDB_API_KEY}&language=nl-NL&region=NL`
    );
    
    // Get full details for each show
    const showsWithDetails = await Promise.all(
      shows.map(async (show: TVShow) => {
        try {
          return await getTVShowDetails(show.id);
        } catch (error) {
          console.error(`Failed to get details for TV show ${show.id}:`, error);
          return show;
        }
      })
    );

    return showsWithDetails;
  } catch (error) {
    console.error('Failed to get TV shows airing today:', error);
    throw error;
  }
}

export async function getMostAnticipatedMovies(): Promise<Movie[]> {
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  try {
    // Get movies with high vote counts and good ratings
    const movies = await fetchAllPages(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&` +
      `primary_release_date.gte=${startDate}&` +
      `primary_release_date.lte=${endDate}&` +
      'sort_by=vote_average.desc&' +
      'vote_count.gte=100&' +
      'vote_average.gte=7&' +
      'with_original_language=en'
    );

    return movies.slice(0, 20); // Return top 20 movies
  } catch (error) {
    console.error('Failed to get most anticipated movies:', error);
    throw error;
  }
}

export async function getPopularTVShows(): Promise<TVShow[]> {
  try {
    const shows = await fetchAllPages(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=nl-NL&region=NL`
    );
    
    // Get full details for each show
    const showsWithDetails = await Promise.all(
      shows.map(async (show: TVShow) => {
        try {
          return await getTVShowDetails(show.id);
        } catch (error) {
          console.error(`Failed to get details for TV show ${show.id}:`, error);
          return show;
        }
      })
    );

    return showsWithDetails.slice(0, 20); // Return top 20 shows
  } catch (error) {
    console.error('Failed to get popular TV shows:', error);
    throw error;
  }
}

export async function getUpcomingArthouseMovies(): Promise<Movie[]> {
  const today = new Date().toISOString().split('T')[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const futureDate = sixMonthsFromNow.toISOString().split('T')[0];

  try {
    // Get upcoming movies from art house production companies
    const movies = await fetchAllPages(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&` +
      `primary_release_date.gte=${today}&` +
      `primary_release_date.lte=${futureDate}&` +
      `with_companies=${ARTHOUSE_COMPANIES.join('|')}&` +
      'sort_by=popularity.desc'
    );
    
    // Get full details to include production companies
    const moviesWithDetails = await Promise.all(
      movies.map(async (movie: Movie) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (error) {
          console.error(`Failed to get details for movie ${movie.id}:`, error);
          return movie;
        }
      })
    );

    return moviesWithDetails.slice(0, 20); // Return top 20 movies
  } catch (error) {
    console.error('Failed to get upcoming arthouse movies:', error);
    throw error;
  }
}

export async function getUpcomingMovies(userId?: string): Promise<Movie[]> {
  // Get upcoming movies for the next 6 months
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  
  // Get multiple pages of results
  const movies = await fetchAllPages(
    `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&region=US`
  );
  
  // Filter future releases within 6 months
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let upcomingMovies = movies.filter((movie: Movie) => {
    const releaseDate = new Date(movie.release_date);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate >= today && releaseDate <= sixMonthsFromNow;
  });

  // Remove duplicates (by ID)
  upcomingMovies = Array.from(
    new Map(upcomingMovies.map(movie => [movie.id, movie])).values()
  );

  // If we have a userId, personalize the results
  if (userId) {
    const preferences = await getUserMoviePreferences(userId);
    
    // Score and sort movies based on user preferences
    upcomingMovies = upcomingMovies
      .map(movie => ({
        ...movie,
        relevanceScore: calculateMovieRelevance(movie, preferences)
      }))
      .sort((a, b) => {
        // Sort primarily by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Then by release date
        return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
      });
  } else {
    // If no userId, just sort by release date
    upcomingMovies.sort((a: Movie, b: Movie) => {
      return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
    });
  }

  // Take top 20 movies
  upcomingMovies = upcomingMovies.slice(0, 20);
  
  // Get IMDB IDs for each movie
  const moviesWithImdbIds = await Promise.all(
    upcomingMovies.map(async (movie: Movie) => {
      const details = await getMovieDetails(movie.id);
      return {
        ...movie,
        imdb_id: details.imdb_id
      };
    })
  );

  return moviesWithImdbIds;
}

async function getUserMoviePreferences(userId: string): Promise<{ genreIds: Set<number> }> {
  // Get all movies from personal and shared watchlists
  const { data: personalMovies } = await supabase
    .from('personal_watchlist')
    .select('movie_data')
    .eq('user_id', userId);

  const { data: sharedMovies } = await supabase
    .from('shared_watchlist')
    .select('movie_data');

  const allMovies = [...(personalMovies || []), ...(sharedMovies || [])];
  
  // Extract unique genre IDs
  const genreIds = new Set<number>();
  allMovies.forEach(item => {
    const movieData = item.movie_data;
    if (movieData.genre_ids) {
      movieData.genre_ids.forEach((id: number) => genreIds.add(id));
    }
    if (movieData.genres) {
      movieData.genres.forEach((genre: { id: number }) => genreIds.add(genre.id));
    }
  });

  return { genreIds };
}

function calculateMovieRelevance(movie: Movie, preferences: { genreIds: Set<number> }): number {
  let score = 0;
  
  // Score based on genre matches
  if (movie.genre_ids) {
    movie.genre_ids.forEach(genreId => {
      if (preferences.genreIds.has(genreId)) {
        score += 1;
      }
    });
  }

  return score;
}