// Test playlist after the fix
// Run this in the browser console on mybeatfi.io

async function testPlaylistAfterFix() {
  console.log('🧪 Testing playlist after fix...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }

  const testSlug = 'john-sama/test-list';

  try {
    // Test 1: Simple playlist query (this should work)
    console.log('\n1. Testing simple playlist query...');
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

    // Test 3: Check access control logic
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

    // Test 5: Test tracks query
    console.log('\n5. Testing tracks query...');
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        *,
        track:tracks!playlist_tracks_track_id_fkey (
          id,
          title,
          artist
        )
      `)
      .eq('playlist_id', playlist.id);

    if (tracksError) {
      console.error('❌ Tracks query failed:', tracksError);
    } else {
      console.log('✅ Tracks query succeeded:', tracks);
      console.log('📊 Number of tracks:', tracks?.length || 0);
    }

    // Test 6: Simulate the exact PlaylistService.getPlaylist logic
    console.log('\n6. Simulating PlaylistService.getPlaylist logic...');
    
    // Check access control
    let canAccess = false;
    if (user) {
      canAccess = (playlist.producer_id === user.id || playlist.is_public);
    } else {
      canAccess = playlist.is_public;
    }
    
    console.log('Can access playlist?', canAccess);
    
    if (!canAccess) {
      console.log('❌ Access denied by logic');
      return;
    }
    
    console.log('✅ Access granted by logic');
    console.log('Final result would be:', {
      ...playlist,
      producer: creator,
      tracks: tracks || []
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPlaylistAfterFix();
