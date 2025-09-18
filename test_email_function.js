// Test script to call the service onboarding email function directly
const testEmailFunction = async () => {
  try {
    console.log('Testing service onboarding email function...');
    
    const functionUrl = 'https://your-project-ref.supabase.co/functions/v1/send-service-onboarding-email';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY' // Replace with your actual anon key
      },
      body: JSON.stringify({ 
        to: 'test@example.com', 
        email: 'test@example.com',
        type: 'studios'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
};

// Run the test
testEmailFunction();
