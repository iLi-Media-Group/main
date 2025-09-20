// Test script for track duration calculation
// Run this in the browser console on mybeatfi.io to test the functionality

console.log('🎵 Testing Track Duration Calculation...');

// Test function to calculate duration from an audio URL
async function testDurationCalculation(audioUrl) {
  try {
    console.log('Testing with URL:', audioUrl);
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        console.log('✅ Duration calculated successfully!');
        console.log('Raw duration (seconds):', duration);
        console.log('Formatted duration:', formattedDuration);
        
        resolve(formattedDuration);
      });
      
      audio.addEventListener('error', (error) => {
        console.error('❌ Error loading audio:', error);
        reject(new Error('Failed to load audio for duration calculation'));
      });
      
      audio.src = audioUrl;
    });
  } catch (error) {
    console.error('❌ Error in duration calculation:', error);
    throw error;
  }
}

// Test function to check if we can access the database
async function testDatabaseAccess() {
  try {
    console.log('🔍 Testing database access...');
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found');
      return false;
    }
    
    // Try to fetch a few tracks
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, audio_url, duration')
      .not('audio_url', 'is', null)
      .not('audio_url', 'eq', '')
      .limit(3);
    
    if (error) {
      console.error('❌ Database error:', error);
      return false;
    }
    
    console.log('✅ Database access successful!');
    console.log('Found tracks:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('Sample track:', {
        id: data[0].id,
        title: data[0].title,
        currentDuration: data[0].duration,
        audioUrl: data[0].audio_url
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing database access:', error);
    return false;
  }
}

// Test function to update a track duration
async function testUpdateTrackDuration(trackId, newDuration) {
  try {
    console.log(`🔄 Testing duration update for track ${trackId} to ${newDuration}...`);
    
    const { error } = await supabase
      .from('tracks')
      .update({ duration: newDuration })
      .eq('id', trackId);
    
    if (error) {
      console.error('❌ Update error:', error);
      return false;
    }
    
    console.log('✅ Duration updated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error updating duration:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting duration calculation tests...\n');
  
  // Test 1: Database access
  console.log('=== TEST 1: Database Access ===');
  const dbAccess = await testDatabaseAccess();
  console.log('');
  
  if (!dbAccess) {
    console.log('❌ Stopping tests due to database access issues');
    return;
  }
  
  // Test 2: Duration calculation with a sample audio URL
  console.log('=== TEST 2: Duration Calculation ===');
  try {
    // You can replace this with an actual audio URL from your tracks
    const sampleAudioUrl = 'https://example.com/sample-audio.mp3';
    const duration = await testDurationCalculation(sampleAudioUrl);
    console.log('Duration calculation result:', duration);
  } catch (error) {
    console.log('Duration calculation test failed (expected if URL is not real)');
  }
  console.log('');
  
  // Test 3: Format validation
  console.log('=== TEST 3: Duration Format Validation ===');
  const testDurations = ['3:45', '0:30', '12:00', 'invalid', '3:60', '60:00'];
  
  testDurations.forEach(duration => {
    const isValid = /^\d{1,2}:\d{2}$/.test(duration);
    const parts = duration.split(':');
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    const isInRange = minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
    
    console.log(`${duration}: ${isValid && isInRange ? '✅ Valid' : '❌ Invalid'}`);
  });
  console.log('');
  
  console.log('🏁 All tests completed!');
  console.log('\n💡 To use the duration updater:');
  console.log('1. Go to /admin/track-durations');
  console.log('2. Click "Update All Durations" to process all tracks');
  console.log('3. Or click individual "Update" buttons for specific tracks');
}

// Export functions for manual testing
window.testDurationCalculation = testDurationCalculation;
window.testDatabaseAccess = testDatabaseAccess;
window.testUpdateTrackDuration = testUpdateTrackDuration;
window.runTests = runTests;

console.log('✅ Test functions loaded!');
console.log('Run runTests() to execute all tests');
console.log('Or run individual functions: testDurationCalculation(url), testDatabaseAccess(), testUpdateTrackDuration(id, duration)');
