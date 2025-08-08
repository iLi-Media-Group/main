// Development mode utilities to prevent unwanted page reloads

export const isDevelopment = process.env.NODE_ENV === 'development';

export const shouldPreventReload = (pathname: string): boolean => {
  if (!isDevelopment) return false;
  
  // Prevent reloads on admin and dashboard pages in development
  const protectedPaths = [
    '/admin',
    '/dashboard', 
    '/producer/dashboard',
    '/producer/banking',
    '/producer/payouts',
    '/producer/withdrawals',
    '/producer/resources',
    '/producer/upload'
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
};

export const setupDevelopmentProtection = () => {
  if (!isDevelopment) return;
  
  // Override window.location.reload in development
  const originalReload = window.location.reload;
  window.location.reload = function(forcedReload?: boolean) {
    const currentPath = window.location.pathname;
    if (shouldPreventReload(currentPath)) {
      console.warn('Prevented page reload in development mode for:', currentPath);
      return;
    }
    return originalReload.call(this, forcedReload);
  };
  
  // Override window.location.replace in development
  const originalReplace = window.location.replace;
  window.location.replace = function(url: string) {
    const currentPath = window.location.pathname;
    if (shouldPreventReload(currentPath)) {
      console.warn('Prevented location replace in development mode for:', currentPath);
      return;
    }
    return originalReplace.call(this, url);
  };
  
  console.log('Development mode protection enabled');
};
