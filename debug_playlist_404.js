// Debug script to identify playlist 404 issue
// Run this in the browser console on mybeatfi.io

async function debugPlaylist404() {
  console.log('🔍 Debugging playlist 404 issue...');
  
  const testSlug = 'john-sama/test-list';
  console.log('Testing slug:', testSlug);
  
  try {
    // 1. Check if the playlist exists in the database
    console.log('\n1. Checking if playlist exists in database...');
    const { data: playlists, error: dbError } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', testSlug);
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }
    
    console.log('📊 Database query result:', playlists);
    
    if (playlists && playlists.length > 0) {
      console.log('✅ Playlist found in database:', playlists[0]);
      
      // 2. Check if the user can access it
      console.log('\n2. Checking user access...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user ? user.id : 'Not logged in');
      
      if (user) {
        console.log('🔐 User is logged in, checking ownership...');
        const playlist = playlists[0];
        console.log('📋 Playlist owner:', playlist.producer_id);
        console.log('👤 Current user:', user.id);
        console.log('🔗 Is owner?', playlist.producer_id === user.id);
        console.log('🌐 Is public?', playlist.is_public);
        console.log('🏷️ Creator type:', playlist.creator_type);
      }
      
    } else {
      console.log('❌ No playlist found with slug:', testSlug);
      
      // 3. Check what playlists exist for the current user
      console.log('\n3. Checking user\'s playlists...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userPlaylists, error: userError } = await supabase
          .from('playlists')
          .select('*')
          .eq('producer_id', user.id);
        
        if (userError) {
          console.error('❌ Error fetching user playlists:', userError);
        } else {
          console.log('📋 User\'s playlists:', userPlaylists);
          
          if (userPlaylists && userPlaylists.length > 0) {
            console.log('🎯 Available playlist slugs:');
            userPlaylists.forEach((p, i) => {
              console.log(`  ${i + 1}. ${p.name} -> ${p.slug} (${p.creator_type})`);
            });
          }
        }
      }
    }
    
    // 4. Test the PlaylistService.getPlaylist method directly
    console.log('\n4. Testing PlaylistService.getPlaylist...');
    try {
      const playlistData = await PlaylistService.getPlaylist(testSlug);
      console.log('🎵 PlaylistService result:', playlistData);
    } catch (serviceError) {
      console.error('❌ PlaylistService error:', serviceError);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPlaylist404();
