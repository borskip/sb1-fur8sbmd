import express from 'express';
import cors from 'cors';
import { addMovieFromExtension } from './movies';

const router = express.Router();

// Enable CORS for the extension
router.use(cors({
  origin: '*', // In production, restrict this to your extension's ID
  methods: ['POST']
}));

router.post('/movies', async (req, res) => {
  try {
    const { movieId, source } = req.body;
    
    if (!movieId || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: movieId and source' 
      });
    }

    if (!['imdb', 'tmdb'].includes(source)) {
      return res.status(400).json({ 
        error: 'Invalid source. Must be either "imdb" or "tmdb"' 
      });
    }

    const movie = await addMovieFromExtension(movieId, source);
    res.json({ success: true, movie });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to add movie' 
    });
  }
});