// Debug script to test playlist access
// Run this in the browser console on mybeatfi.io

console.log('🔍 Testing playlist access...');

// Test the specific playlists we know exist
const testSlugs = [
  'john-sama/test-list',           // Client playlist
  'knock-rio-beats/hiphop-playlist' // Producer playlist
];

async function testPlaylistAccess() {
  console.log('🌐 Current URL:', window.location.href);
  console.log('🔧 Testing React Router setup...');
  
  // Check if we're on the right domain
  if (!window.location.href.includes('mybeatfi.io')) {
    console.log('⚠️ Not on mybeatfi.io domain');
    return;
  }
  
  for (const slug of testSlugs) {
    console.log(`\n📋 Testing playlist: ${slug}`);
    
    try {
      // Test direct API call to verify playlist exists
      const response = await fetch(`https://yciqkebqlajqbpwlujma.supabase.co/rest/v1/playlists?select=*&slug=eq.${slug}`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFrZWJxbGFqcWJwd2x1am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI4OTAsImV4cCI6MjA3MTk2ODg5MH0.2dcd40dc-9e3a-43a7-93de-a22a4aaca532',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFrZWJxbGFqcWJwd2x1am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI4OTAsImV4cCI6MjA3MTk2ODg5MH0.2dcd40dc-9e3a-43a7-93de-a22a4aaca532'
        }
      });
      
      const data = await response.json();
      console.log(`✅ API Response for ${slug}:`, data);
      
      if (data && data.length > 0) {
        console.log(`✅ Playlist found:`, data[0]);
        
        // Test the exact URL that should work
        const testUrl = `https://mybeatfi.io/playlist/${slug}`;
        console.log(`🔗 Testing URL: ${testUrl}`);
        
        // Try to navigate to the URL
        console.log('🔄 Attempting navigation...');
        window.location.href = testUrl;
        
      } else {
        console.log(`❌ Playlist not found in API`);
      }
      
    } catch (error) {
      console.log(`❌ API Error for ${slug}:`, error);
    }
  }
}

// Also test if we can access the route from the current page
function testCurrentPageRouting() {
  console.log('\n🧪 Testing current page routing...');
  
  // Check if React Router is available
  if (window.ReactRouterDOM) {
    console.log('✅ React Router DOM is available');
  } else {
    console.log('❌ React Router DOM not found');
  }
  
  // Check if we can access the PlaylistView component
  if (window.PlaylistView) {
    console.log('✅ PlaylistView component is available');
  } else {
    console.log('❌ PlaylistView component not found');
  }
  
  // Test a simple navigation
  console.log('🔄 Testing navigation to a known working route...');
  window.location.href = '/catalog';
}

// Run the tests
testPlaylistAccess();
// testCurrentPageRouting();
