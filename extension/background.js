// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Movie Tracker extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MOVIE_ADDED' || message.type === 'ERROR') {
    // Forward messages to popup
    chrome.runtime.sendMessage(message);
  }
});