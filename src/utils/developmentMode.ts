// Development mode utilities to prevent unwanted page reloads

export const isDevelopment = process.env.NODE_ENV === 'development';

export const shouldPreventReload = (pathname: string): boolean => {
  if (!isDevelopment) return false;
  
  // Only prevent reloads on specific admin pages in development, not all pages
  const protectedPaths = [
    '/admin/producer-applications',
    '/admin/white-label-clients',
    '/admin/services',
    '/admin/resources',
    '/admin/banking',
    '/admin/analytics'
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
};

export const setupDevelopmentProtection = () => {
  if (!isDevelopment) return;
  
  // Only override reload for specific protected paths
  const originalReload = window.location.reload;
  window.location.reload = function(forcedReload?: boolean) {
    const currentPath = window.location.pathname;
    if (shouldPreventReload(currentPath)) {
      console.warn('Prevented page reload in development mode for:', currentPath);
      return;
    }
    return originalReload.call(this, forcedReload);
  };
  
  console.log('Development mode protection enabled (limited scope)');
};
