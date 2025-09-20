// Simple test to check if the application is loading properly
// Run this in the browser console on mybeatfi.io

console.log('🧪 Testing application loading...');

// Check if React is loaded
console.log('React available:', typeof React !== 'undefined');

// Check if the page has loaded
console.log('Page title:', document.title);

// Check if there are any script errors
console.log('Scripts loaded:', document.scripts.length);

// Check if there are any elements on the page
console.log('Body children:', document.body.children.length);

// Check if there are any error messages in the page
const errorElements = document.querySelectorAll('.error, [class*="error"], [id*="error"]');
console.log('Error elements found:', errorElements.length);

// Check if there are any console errors (this won't catch them, but we can see if the page is responsive)
console.log('Page is responsive:', document.readyState);

// Try to find any Supabase-related elements or scripts
const supabaseScripts = Array.from(document.scripts).filter(script => 
  script.src && script.src.includes('supabase')
);
console.log('Supabase scripts found:', supabaseScripts.length);

// Check if there are any environment variables exposed
console.log('Environment check - VITE_SUPABASE_URL exists:', typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL);

console.log('✅ Application loading test complete');
