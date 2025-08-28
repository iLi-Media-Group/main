// Test script for welcome email function
async function testWelcomeEmail() {
  try {
    console.log('Testing welcome email function...');
    
    const response = await fetch('https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        first_name: 'Test User',
        account_type: 'client'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (!response.ok) {
      console.error('Function failed with status:', response.status);
    } else {
      console.log('Function succeeded!');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testWelcomeEmail();
