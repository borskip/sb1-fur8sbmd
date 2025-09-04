const TMDB_API_KEY = '8b7a8c9d2e3f4a5b6c7d8e9f0a1b2c3d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  original_title: string;
  video: boolean;
}

export interface MovieDetails extends Movie {
  runtime: number | null;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  credits?: {
    cast: Person[];
    crew: Person[];
  };
  director?: string;
  actors?: string;
  boxOffice?: string;
  awards?: string;
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
  gender: number;
  adult: boolean;
  known_for: Movie[];
  job?: string;
  department?: string;
  character?: string;
  cast_id?: number;
  credit_id?: string;
  order?: number;
}

export interface SearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface PersonSearchResponse {
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenreResponse {
  genres: Genre[];
}

class TMDBService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private async fetchWithCache<T>(url: string): Promise<T> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('TMDB API Error:', error);
      throw error;
    }
  }

  async searchMovies(query: string, page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async searchPeople(query: string, page = 1): Promise<PersonSearchResponse> {
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    return this.fetchWithCache<PersonSearchResponse>(url);
  }

  async searchMulti(query: string, page = 1): Promise<{ results: (Movie | Person)[] }> {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    return this.fetchWithCache<{ results: (Movie | Person)[] }>(url);
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
    const movie = await this.fetchWithCache<MovieDetails>(url);
    
    // Extract director and main actors
    if (movie.credits) {
      const director = movie.credits.crew.find(person => person.job === 'Director');
      movie.director = director?.name;
      
      const mainActors = movie.credits.cast.slice(0, 5).map(actor => actor.name);
      movie.actors = mainActors.join(', ');
    }
    
    return movie;
  }

  async getPersonDetails(personId: number): Promise<Person> {
    const url = `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&append_to_response=movie_credits`;
    return this.fetchWithCache<Person>(url);
  }

  async getPersonMovies(personId: number): Promise<Movie[]> {
    const url = `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`;
    const response = await this.fetchWithCache<{ cast: Movie[]; crew: Movie[] }>(url);
    
    // Combine cast and crew movies, remove duplicates, sort by popularity
    const allMovies = [...response.cast, ...response.crew];
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );
    
    return uniqueMovies
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20); // Limit to top 20 movies
  }

  async getGenres(): Promise<Genre[]> {
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`;
    const response = await this.fetchWithCache<GenreResponse>(url);
    return response.genres;
  }

  async getMoviesByGenre(genreId: number, page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async getMoviesByYear(year: number, page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year}&page=${page}&sort_by=popularity.desc&include_adult=false`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async getPopularMovies(page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async getUpcomingMovies(page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  async getTopRatedMovies(page = 1): Promise<SearchResponse> {
    const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
    return this.fetchWithCache<SearchResponse>(url);
  }

  getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  getYouTubeUrl(key: string): string {
    return `https://www.youtube.com/watch?v=${key}`;
  }
}

export const tmdbService = new TMDBService();