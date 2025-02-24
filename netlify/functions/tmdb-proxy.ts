import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_DURATION = 60 * 15; // 15 minutes in seconds

const handler: Handler = async (event) => {
  try {
    const { path, query } = event.queryStringParameters || {};

    if (!path) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Path parameter is required' })
      };
    }

    // Construct TMDB URL
    const tmdbUrl = `${TMDB_BASE_URL}${path}?api_key=${TMDB_API_KEY}${query ? `&${query}` : ''}`;

    // Fetch data from TMDB
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    // Set cache headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('TMDB proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from TMDB' })
    };
  }
};

export { handler };