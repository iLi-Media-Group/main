// Fixed test that works in browser console
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

// Check if there are any global variables that might be Supabase
console.log('Global supabase available:', typeof window.supabase !== 'undefined');
console.log('Global __SUPABASE__ available:', typeof window.__SUPABASE__ !== 'undefined');

// Check if there are any elements with Supabase-related classes or IDs
const supabaseElements = document.querySelectorAll('[class*="supabase"], [id*="supabase"]');
console.log('Supabase elements found:', supabaseElements.length);

// Check if there are any error messages visible on the page (fixed version)
const allElements = document.querySelectorAll('div, span, p');
let visibleErrors = 0;
for (let i = 0; i < allElements.length; i++) {
  const el = allElements[i];
  if (el.textContent && el.textContent.toLowerCase().includes('error')) {
    visibleErrors++;
  }
}
console.log('Visible error messages:', visibleErrors);

// Check if the page is showing a 404 or error page
const pageText = document.body.textContent || '';
console.log('Page contains "404":', pageText.includes('404'));
console.log('Page contains "not found":', pageText.toLowerCase().includes('not found'));
console.log('Page contains "error":', pageText.toLowerCase().includes('error'));

// Check current URL
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

// Check if we're on a playlist page
console.log('Is on playlist page:', window.location.pathname.startsWith('/playlist/'));

console.log('✅ Application loading test complete');
