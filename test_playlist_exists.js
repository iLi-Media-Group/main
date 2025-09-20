// Test to check if playlist exists in database
// Run this in the browser console on mybeatfi.io

async function testPlaylistExists() {
  console.log('🧪 Testing if playlist exists...');
  
  try {
    // Try to access the Supabase client from the application
    // First, let's see if we can find it in the global scope
    let supabase = null;
    
    // Try different ways to access the Supabase client
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase;
      console.log('✅ Found supabase in window.supabase');
    } else if (typeof window.__SUPABASE__ !== 'undefined') {
      supabase = window.__SUPABASE__;
      console.log('✅ Found supabase in window.__SUPABASE__');
    } else {
      // Try to find it in the React app
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactInternalFiber) {
        console.log('React root found, but no direct access to supabase');
      }
      
      // Create our own client
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
      const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFrZWJxbGFqcWJwd2x1am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzE5NzQsImV4cCI6MjA0NzU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // This is a placeholder
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Created our own supabase client');
    }
    
    if (!supabase) {
      console.error('❌ Could not access Supabase client');
      return;
    }
    
    const testSlug = 'john-sama/test-list';
    console.log('Testing slug:', testSlug);
    
    // Test 1: Check if playlist exists
    console.log('\n1. Checking if playlist exists...');
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (playlistError) {
      console.error('❌ Playlist query failed:', playlistError);
      
      // Check if it's a "not found" error or something else
      if (playlistError.code === 'PGRST116') {
        console.log('This means the playlist does not exist in the database');
      } else if (playlistError.code === '42501') {
        console.log('This means there is a permission/RLS issue');
      }
      return;
    }
    
    console.log('✅ Playlist found:', playlist);
    
    // Test 2: Check if it's public
    console.log('\n2. Checking playlist visibility...');
    console.log('Is public:', playlist.is_public);
    console.log('Creator type:', playlist.creator_type);
    console.log('Producer ID:', playlist.producer_id);
    
    // Test 3: Check if we can access it as a public user
    console.log('\n3. Testing public access...');
    const { data: publicPlaylist, error: publicError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .eq('is_public', true)
      .single();
      
    if (publicError) {
      console.error('❌ Public access failed:', publicError);
    } else {
      console.log('✅ Public access successful:', publicPlaylist);
    }
    
    // Test 4: Check if the creator profile exists
    console.log('\n4. Checking creator profile...');
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playlist.producer_id)
      .single();
      
    if (creatorError) {
      console.error('❌ Creator profile query failed:', creatorError);
    } else {
      console.log('✅ Creator profile found:', creator);
    }
    
    // Test 5: Check if there are any tracks in the playlist
    console.log('\n5. Checking playlist tracks...');
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlist.id);
      
    if (tracksError) {
      console.error('❌ Tracks query failed:', tracksError);
    } else {
      console.log('✅ Tracks found:', tracks?.length || 0);
      if (tracks && tracks.length > 0) {
        console.log('Sample track:', tracks[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPlaylistExists();
