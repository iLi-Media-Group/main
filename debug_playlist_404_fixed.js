// Fixed debug script to identify playlist 404 issue
// Run this in the browser console on mybeatfi.io

async function debugPlaylist404Fixed() {
  console.log('🔍 Debugging playlist 404 issue...');
  
  // Get the Supabase client from the window object
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you\'re on mybeatfi.io');
    return;
  }
  
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
          } else {
            console.log('📭 No playlists found for current user');
          }
        }
      } else {
        console.log('🚫 User not logged in');
      }
    }
    
    // 4. Test direct database query with different conditions
    console.log('\n4. Testing different database queries...');
    
    // Test without any filters
    const { data: allPlaylists, error: allError } = await supabase
      .from('playlists')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error fetching all playlists:', allError);
    } else {
      console.log('📋 Sample of all playlists:', allPlaylists);
    }
    
    // Test with partial slug match
    const { data: partialMatches, error: partialError } = await supabase
      .from('playlists')
      .select('*')
      .ilike('slug', '%john%');
    
    if (partialError) {
      console.error('❌ Error fetching partial matches:', partialError);
    } else {
      console.log('🔍 Playlists with "john" in slug:', partialMatches);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Alternative: Simple test to check if we can access the database at all
async function simpleDatabaseTest() {
  console.log('🧪 Simple database connectivity test...');
  
  try {
    // Try to get the current user first
    const { data: { user }, error: userError } = await window.supabase?.auth.getUser();
    
    if (userError) {
      console.error('❌ User auth error:', userError);
    } else {
      console.log('✅ User auth working. User:', user ? user.id : 'Not logged in');
    }
    
    // Try a simple query
    const { data, error } = await window.supabase?.from('playlists').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database query error:', error);
    } else {
      console.log('✅ Database connectivity working');
    }
    
  } catch (error) {
    console.error('❌ Simple test failed:', error);
  }
}

// Run both tests
simpleDatabaseTest();
debugPlaylist404Fixed();
