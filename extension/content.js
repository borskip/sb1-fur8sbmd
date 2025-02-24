// Movie link patterns to match
const MOVIE_PATTERNS = [
  /imdb\.com\/title\/(tt\d+)/i,
  /themoviedb\.org\/movie\/(\d+)/i
];

// Function to extract movie IDs from links
function extractMovieId(url) {
  for (const pattern of MOVIE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        id: match[1],
        source: url.includes('imdb.com') ? 'imdb' : 'tmdb'
      };
    }
  }
  return null;
}

// Function to send movie to your tracker
async function sendToMovieTracker(movieInfo) {
  try {
    const response = await fetch('http://localhost:5173/api/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieId: movieInfo.id,
        source: movieInfo.source
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add movie');
    }
    
    const data = await response.json();
    
    // Notify user of success
    chrome.runtime.sendMessage({
      type: 'MOVIE_ADDED',
      movieId: movieInfo.id,
      title: data.movie.movie_data.title
    });
  } catch (error) {
    console.error('Failed to send movie to tracker:', error);
    chrome.runtime.sendMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}

// Watch for new messages in Signal Web
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Look for links in new messages
        const links = node.querySelectorAll('a');
        for (const link of links) {
          const movieInfo = extractMovieId(link.href);
          if (movieInfo) {
            sendToMovieTracker(movieInfo);
          }
        }
      }
    }
  }
});

// Start observing when Signal Web is loaded
function initializeObserver() {
  const chatContainer = document.querySelector('#main');
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  } else {
    // Retry if chat container isn't loaded yet
    setTimeout(initializeObserver, 1000);
  }
}

initializeObserver();