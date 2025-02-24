// Function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

// Function to update movies list
function updateMoviesList(movies) {
  const moviesContainer = document.getElementById('movies');
  const empty = document.querySelector('.empty');
  
  if (movies.length === 0) {
    if (!empty) {
      moviesContainer.innerHTML = '<div class="empty">No movies added yet</div>';
    }
    return;
  }
  
  if (empty) {
    empty.remove();
  }
  
  movies.forEach(movie => {
    const movieElement = document.createElement('div');
    movieElement.className = `movie ${movie.error ? 'error' : ''}`;
    movieElement.innerHTML = `
      <div>${movie.error ? `Error: ${movie.error}` : `Added: ${movie.title}`}</div>
      <div class="time">${formatRelativeTime(new Date(movie.time))}</div>
    `;
    moviesContainer.prepend(movieElement);
  });
}

// Check if we're connected to Signal Web
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const status = document.getElementById('status');
  
  if (currentTab.url?.includes('web.signal.org')) {
    status.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Connected to Signal Web
    `;
    status.className = 'status active';
  } else {
    status.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      Please open Signal Web to use this extension
    `;
    status.className = 'status inactive';
  }
});

// Load and display stored movies
chrome.storage.local.get(['movies'], (result) => {
  const movies = result.movies || [];
  updateMoviesList(movies);
});

// Listen for movie additions
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'MOVIE_ADDED' || message.type === 'ERROR') {
    chrome.storage.local.get(['movies'], (result) => {
      const movies = result.movies || [];
      const newMovie = {
        time: new Date().toISOString(),
        ...(message.type === 'MOVIE_ADDED' 
          ? { title: message.title || message.movieId }
          : { error: message.error }
        )
      };
      
      const updatedMovies = [newMovie, ...movies].slice(0, 50); // Keep last 50 movies
      chrome.storage.local.set({ movies: updatedMovies });
      updateMoviesList([newMovie]);
    });
  }
});