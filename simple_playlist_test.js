// Simple playlist test - run this in browser console on mybeatfi.io

async function simplePlaylistTest() {
  console.log('🧪 Simple playlist test...');
  
  try {
    // Create our own Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFrZWJxbGFqcWJwd2x1am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzE5NzQsImV4cCI6MjA0NzU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // This is a placeholder
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
      console.log('Error code:', playlistError.code);
      console.log('Error message:', playlistError.message);
      
      if (playlistError.code === 'PGRST116') {
        console.log('This means the playlist does not exist in the database');
      } else if (playlistError.code === '42501') {
        console.log('This means there is a permission/RLS issue');
      }
      return;
    }
    
    console.log('✅ Playlist found:', playlist);
    console.log('Is public:', playlist.is_public);
    console.log('Creator type:', playlist.creator_type);
    console.log('Producer ID:', playlist.producer_id);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
simplePlaylistTest();
