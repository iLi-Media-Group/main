// Welcome Email Test Script
// Run this in your browser console on mybeatfi.io to test the welcome email function

async function testWelcomeEmail(email) {
  console.log('Testing welcome email for:', email);
  
  try {
    // Get the Supabase client from the page
    const { supabase } = window;
    
    if (!supabase) {
      console.error('Supabase client not found. Make sure you are on mybeatfi.io');
      return;
    }
    
    const { error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: email,
        first_name: 'Test User',
        account_type: 'client'
      }
    });

    if (error) {
      console.error('❌ Welcome email test failed:', error);
      alert(`Failed to send welcome email: ${error.message}`);
    } else {
      console.log('✅ Welcome email test successful');
      alert('Welcome email sent successfully! Check your inbox.');
    }
  } catch (err) {
    console.error('❌ Welcome email test error:', err);
    alert(`Error: ${err.message}`);
  }
}

// Usage:
// testWelcomeEmail('your-email@example.com');

console.log('Welcome Email Test Script loaded!');
console.log('To test, run: testWelcomeEmail("your-email@example.com")');
