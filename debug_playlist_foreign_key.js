// Debug script to test foreign key relationships and profile data
// Run this in the browser console on mybeatfi.io

async function debugPlaylistForeignKey() {
  console.log('🔍 Testing playlist foreign key relationships...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }

  const testSlug = 'john-sama/test-list';

  try {
    // 1. Test the playlist query without the foreign key join
    console.log('\n1. Testing playlist query without foreign key...');
    const { data: playlistSimple, error: simpleError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (simpleError) {
      console.error('❌ Simple playlist query failed:', simpleError);
      return;
    }
    console.log('✅ Simple playlist query succeeded:', playlistSimple);

    // 2. Test if the producer profile exists
    console.log('\n2. Testing producer profile existence...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playlistSimple.producer_id)
      .single();

    if (profileError) {
      console.error('❌ Profile query failed:', profileError);
      console.log('This might be causing the foreign key join to fail');
    } else {
      console.log('✅ Profile exists:', profile);
    }

    // 3. Test the full query with foreign key join
    console.log('\n3. Testing full query with foreign key join...');
    const { data: playlistFull, error: fullError } = await supabase
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

    if (fullError) {
      console.error('❌ Full query with foreign key failed:', fullError);
      console.log('This confirms the foreign key join is the issue');
    } else {
      console.log('✅ Full query succeeded:', playlistFull);
    }

    // 4. Test the tracks query
    console.log('\n4. Testing tracks query...');
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
      .eq('playlist_id', playlistSimple.id);

    if (tracksError) {
      console.error('❌ Tracks query failed:', tracksError);
    } else {
      console.log('✅ Tracks query succeeded:', tracks);
      console.log('📊 Number of tracks:', tracks?.length || 0);
    }

    // 5. Test the exact query that PlaylistService.getPlaylist uses
    console.log('\n5. Testing exact PlaylistService query...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user ? user.id : 'Not logged in');

    const { data: exactPlaylist, error: exactError } = await supabase
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

    if (exactError) {
      console.error('❌ Exact PlaylistService query failed:', exactError);
      console.log('Error details:', {
        code: exactError.code,
        message: exactError.message,
        details: exactError.details,
        hint: exactError.hint
      });
    } else {
      console.log('✅ Exact PlaylistService query succeeded:', exactPlaylist);
      
      // Test access control logic
      if (user) {
        console.log('🔐 Access control check:');
        console.log('Playlist owner:', exactPlaylist.producer_id);
        console.log('Current user:', user.id);
        console.log('Is owner?', exactPlaylist.producer_id === user.id);
        console.log('Is public?', exactPlaylist.is_public);
        
        if (exactPlaylist.producer_id !== user.id && !exactPlaylist.is_public) {
          console.log('❌ Access would be denied');
        } else {
          console.log('✅ Access would be granted');
        }
      } else {
        console.log('🚫 User not logged in, checking public access');
        if (!exactPlaylist.is_public) {
          console.log('❌ Access would be denied - not public');
        } else {
          console.log('✅ Access would be granted - public playlist');
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPlaylistForeignKey();
