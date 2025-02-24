import { z } from 'zod';

const PATHE_API_URL = 'https://api.pathe.nl/v1';

const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  originalTitle: z.string().optional(),
  releaseDate: z.string(),
  synopsis: z.string().optional(),
  duration: z.number().optional(),
  posterImage: z.string().optional(),
  genres: z.array(z.string()).optional(),
  cast: z.array(z.string()).optional(),
  directors: z.array(z.string()).optional(),
  rating: z.number().optional(),
  showtimes: z.array(z.object({
    time: z.string(),
    cinema: z.object({
      name: z.string(),
      city: z.string()
    })
  })).optional()
});

export type MovieMeterMovie = z.infer<typeof movieSchema>;

async function fetchWithCache<T>(
  url: string,
  schema: z.ZodType<T>,
  cacheKey: string,
  debug = false
): Promise<T> {
  try {
    // Check if we have cached data and it's less than 15 minutes old
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 1000 * 60 * 15) { // 15 minutes
        const parsed = schema.parse(data);
        if (debug) {
          console.log('Using cached data for:', url);
        }
        return parsed;
      }
    }

    if (debug) {
      console.log('Fetching:', url);
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Platform': 'web',
        'X-Client-Version': '1.0.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (debug) {
      console.log('Response:', data);
    }

    const parsed = schema.parse(data);

    // Cache the successful result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: parsed,
      timestamp: Date.now()
    }));

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Schema validation error:', error.errors);
      throw new Error('Invalid response format from API');
    }
    throw error;
  }
}

export async function getNowPlayingInNijmegen(): Promise<MovieMeterMovie[]> {
  try {
    console.log('Fetching movies now playing in Nijmegen...');
    
    // Get movies from Pathé Nijmegen (cinema ID: 13)
    const url = `${PATHE_API_URL}/cinemas/13/movies/showing`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Platform': 'web',
        'X-Client-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Pathé API: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Pathé data to our format
    const movies = data.movies.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.originalTitle,
      releaseDate: movie.releaseDate,
      synopsis: movie.synopsis,
      duration: movie.duration,
      posterImage: movie.posterImage,
      genres: movie.genres?.map((g: any) => g.name),
      cast: movie.cast,
      directors: movie.directors,
      rating: movie.rating,
      showtimes: movie.showtimes?.map((st: any) => ({
        time: st.time,
        cinema: {
          name: 'Pathé Nijmegen',
          city: 'Nijmegen'
        }
      }))
    }));

    return movies;
  } catch (error) {
    console.error('Failed to get movies playing in Nijmegen:', error);
    throw error;
  }
}