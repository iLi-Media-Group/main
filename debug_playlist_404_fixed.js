// Comprehensive debug script to test PlaylistService.getPlaylist method
// Run this in the browser console on mybeatfi.io

async function debugPlaylistService() {
  console.log('🔍 Testing PlaylistService.getPlaylist method...');
  
  // Get the Supabase client from the window object
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you\'re on mybeatfi.io');
    return;
  }

  const testSlug = 'john-sama/test-list';
  console.log('Testing slug:', testSlug);

  try {
    // 1. Test the exact query that PlaylistService.getPlaylist uses
    console.log('\n1. Testing PlaylistService.getPlaylist query...');
    
    // First, get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User auth error:', userError);
    } else {
      console.log('✅ User auth working. User:', user ? user.id : 'Not logged in');
    }

    // Test the exact query from PlaylistService.getPlaylist
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .eq('slug', testSlug)
      .single();

    if (error) {
      console.error('❌ PlaylistService.getPlaylist query failed:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ PlaylistService.getPlaylist query succeeded:', playlist);
      
      // 2. Test the access control logic
      console.log('\n2. Testing access control logic...');
      if (user) {
        console.log('👤 User is logged in, checking ownership...');
        console.log('📋 Playlist owner:', playlist.producer_id);
        console.log('👤 Current user:', user.id);
        console.log('🔗 Is owner?', playlist.producer_id === user.id);
        console.log('🌐 Is public?', playlist.is_public);
        
        if (playlist.producer_id !== user.id && !playlist.is_public) {
          console.log('❌ Access denied - not owner and not public');
        } else {
          console.log('✅ Access granted');
        }
      } else {
        console.log('🚫 User not logged in');
        if (!playlist.is_public) {
          console.log('❌ Access denied - not logged in and not public');
        } else {
          console.log('✅ Access granted - public playlist');
        }
      }
      
      // 3. Test the tracks query
      console.log('\n3. Testing tracks query...');
      const { data: tracks, error: tracksError } = await supabase
        .from('playlist_tracks')
        .select(`
          *,
          track:tracks!playlist_tracks_track_id_fkey (
            id,
            title,
            artist,
            genres,
            sub_genres,
            moods,
            instruments,
            media_usage,
            duration,
            bpm,
            audio_url,
            image_url,
            has_sting_ending,
            is_one_stop,
            mp3_url,
            trackouts_url,
            stems_url,
            has_vocals,
            is_sync_only,
            track_producer_id,
            producer:profiles!tracks_track_producer_id_fkey (
              id,
              first_name,
              last_name,
              email,
              avatar_path
            )
          )
        `)
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: true });

      if (tracksError) {
        console.error('❌ Tracks query failed:', tracksError);
      } else {
        console.log('✅ Tracks query succeeded:', tracks);
        console.log('📊 Number of tracks:', tracks?.length || 0);
      }
    }

    // 4. Test RLS policies
    console.log('\n4. Testing RLS policies...');
    
    // Test with service role (bypass RLS)
    const { data: serviceRoleData, error: serviceRoleError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (serviceRoleError) {
      console.error('❌ Service role query failed:', serviceRoleError);
    } else {
      console.log('✅ Service role query succeeded:', serviceRoleData);
    }

    // 5. Test different query approaches
    console.log('\n5. Testing different query approaches...');
    
    // Test without the producer join
    const { data: simpleData, error: simpleError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
    } else {
      console.log('✅ Simple query succeeded:', simpleData);
    }

    // Test with partial slug match
    const { data: partialData, error: partialError } = await supabase
      .from('playlists')
      .select('*')
      .ilike('slug', '%john-sama%')
      .limit(5);

    if (partialError) {
      console.error('❌ Partial slug query failed:', partialError);
    } else {
      console.log('✅ Partial slug query succeeded:', partialData);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Alternative: Test the actual PlaylistService if available
async function testPlaylistServiceDirect() {
  console.log('🔍 Testing PlaylistService directly...');
  
  try {
    // Check if PlaylistService is available in the global scope
    if (window.PlaylistService) {
      console.log('✅ PlaylistService found in global scope');
      
      const testSlug = 'john-sama/test-list';
      const result = await window.PlaylistService.getPlaylist(testSlug);
      console.log('PlaylistService.getPlaylist result:', result);
    } else {
      console.log('❌ PlaylistService not found in global scope');
    }
  } catch (error) {
    console.error('❌ PlaylistService test failed:', error);
  }
}

// Run both tests
debugPlaylistService();
testPlaylistServiceDirect();
