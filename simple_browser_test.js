// Simple test that creates its own Supabase client
// Run this in the browser console on mybeatfi.io

async function testPlaylistWithOwnClient() {
  console.log('🧪 Testing playlist with own Supabase client...');
  
  try {
    // Create our own Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    
    // Use the same URL and key from the application
    const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFrZWJxbGFqcWJwd2x1am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzE5NzQsImV4cCI6MjA0NzU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // This is a placeholder - you'll need the actual anon key
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const testSlug = 'john-sama/test-list';
    
    // Test 1: Simple playlist query
    console.log('\n1. Testing playlist query...');
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (playlistError) {
      console.error('❌ Playlist query failed:', playlistError);
      return;
    }
    console.log('✅ Playlist query succeeded:', playlist);

    // Test 2: Check if user is logged in
    console.log('\n2. Checking user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User auth error:', userError);
    } else {
      console.log('✅ User auth working. User:', user ? user.id : 'Not logged in');
    }

    // Test 3: Check access control
    console.log('\n3. Testing access control...');
    if (user) {
      console.log('👤 User is logged in');
      console.log('Playlist owner:', playlist.producer_id);
      console.log('Current user:', user.id);
      console.log('Is owner?', playlist.producer_id === user.id);
      console.log('Is public?', playlist.is_public);
      
      if (playlist.producer_id !== user.id && !playlist.is_public) {
        console.log('❌ Access would be denied - not owner and not public');
      } else {
        console.log('✅ Access would be granted');
      }
    } else {
      console.log('🚫 User not logged in');
      if (!playlist.is_public) {
        console.log('❌ Access would be denied - not logged in and not public');
      } else {
        console.log('✅ Access would be granted - public playlist');
      }
    }

    // Test 4: Test creator profile query
    console.log('\n4. Testing creator profile query...');
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_path
      `)
      .eq('id', playlist.producer_id)
      .single();

    if (creatorError) {
      console.error('❌ Creator profile query failed:', creatorError);
    } else {
      console.log('✅ Creator profile query succeeded:', creator);
    }

    // Test 5: Simulate the final result
    console.log('\n5. Final result simulation...');
    let canAccess = false;
    if (user) {
      canAccess = (playlist.producer_id === user.id || playlist.is_public);
    } else {
      canAccess = playlist.is_public;
    }
    
    console.log('Can access playlist?', canAccess);
    
    if (canAccess) {
      console.log('✅ Access granted by logic');
      console.log('Final result would be:', {
        ...playlist,
        producer: creator,
        tracks: [] // We didn't test tracks query to keep it simple
      });
    } else {
      console.log('❌ Access denied by logic');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPlaylistWithOwnClient();
