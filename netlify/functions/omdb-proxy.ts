import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'https://www.omdbapi.com';
const CACHE_DURATION = 60 * 60 * 24; // 24 hours in seconds

const handler: Handler = async (event) => {
  try {
    // Validate API key
    if (!OMDB_API_KEY) {
      throw new Error('OMDB_API_KEY environment variable is not set');
    }

    const { imdbId } = event.queryStringParameters || {};

    if (!imdbId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'IMDB ID is required' })
      };
    }

    // Validate IMDB ID format
    if (!/^tt\d+$/.test(imdbId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid IMDB ID format' })
      };
    }

    // Construct OMDB URL
    const omdbUrl = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}`;

    // Fetch data from OMDB
    const response = await fetch(omdbUrl);
    
    if (!response.ok) {
      throw new Error(`OMDB API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.Response === 'False') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: data.Error || 'Movie not found' })
      };
    }

    // Set cache headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('OMDB proxy error:', error);
    
    // Return appropriate error response
    if (error instanceof Error && error.message.includes('OMDB_API_KEY')) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OMDB API configuration error' })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from OMDB' })
    };
  }
};

export { handler };