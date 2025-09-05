// Try to access Supabase client from the React application
// Run this in the browser console on mybeatfi.io

async function accessSupabaseFromApp() {
  console.log('🧪 Trying to access Supabase from React app...');
  
  try {
    // Method 1: Try to access through React DevTools
    const reactRoot = document.querySelector('#root');
    console.log('React root found:', !!reactRoot);
    
    // Method 2: Try to find any global variables
    console.log('Available global variables with "supabase":', 
      Object.keys(window).filter(key => key.toLowerCase().includes('supabase')));
    
    // Method 3: Try to access through the application's module system
    console.log('Available global variables with "playlist":', 
      Object.keys(window).filter(key => key.toLowerCase().includes('playlist')));
    
    // Method 4: Try to find any Supabase-related objects
    console.log('Available global variables with "createClient":', 
      Object.keys(window).filter(key => key.toLowerCase().includes('createclient')));
    
    // Method 5: Check if we can access the application's modules
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('React DevTools available');
      const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
      console.log('React renderers:', renderers);
    }
    
    // Method 6: Try to find the application's bundle
    const scripts = Array.from(document.scripts);
    console.log('Scripts found:', scripts.length);
    scripts.forEach((script, index) => {
      if (script.src) {
        console.log(`Script ${index}:`, script.src);
      }
    });
    
    // Method 7: Try to access through window object inspection
    console.log('Window object keys (first 50):', Object.keys(window).slice(0, 50));
    
  } catch (error) {
    console.error('❌ Error accessing Supabase:', error);
  }
}

// Alternative: Try to trigger the playlist loading directly
async function triggerPlaylistLoad() {
  console.log('🧪 Trying to trigger playlist load...');
  
  try {
    // Look for any React components that might be related to playlists
    const playlistElements = document.querySelectorAll('[class*="playlist"], [id*="playlist"]');
    console.log('Playlist-related elements found:', playlistElements.length);
    
    // Look for any loading states or error messages
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    console.log('Loading elements found:', loadingElements.length);
    
    // Look for any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="not-found"]');
    console.log('Error elements found:', errorElements.length);
    
    // Try to find the actual playlist component
    const playlistViewElements = document.querySelectorAll('div');
    let foundPlaylistView = false;
    
    for (let i = 0; i < playlistViewElements.length; i++) {
      const el = playlistViewElements[i];
      if (el.textContent && el.textContent.includes('Playlist Not Found')) {
        console.log('Found Playlist Not Found message in element:', el);
        foundPlaylistView = true;
        break;
      }
    }
    
    if (!foundPlaylistView) {
      console.log('Could not find Playlist Not Found message');
    }
    
  } catch (error) {
    console.error('❌ Error triggering playlist load:', error);
  }
}

// Run both tests
accessSupabaseFromApp();
triggerPlaylistLoad();
