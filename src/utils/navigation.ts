import { NavigateFunction } from 'react-router-dom';

// Utility function to replace window.location.href with React Router navigation
export const navigateTo = (navigate: NavigateFunction, path: string, replace: boolean = false) => {
  navigate(path, { replace });
};

// Utility function to handle external URLs (like Stripe checkout)
export const navigateToExternal = (url: string, target: '_self' | '_blank' = '_self') => {
  if (target === '_self') {
    window.location.href = url;
  } else {
    window.open(url, target);
  }
};

// Utility function to handle checkout URLs specifically
export const navigateToCheckout = (checkoutUrl: string) => {
  window.location.href = checkoutUrl;
};

// Utility function to handle success redirects
export const navigateToSuccess = (navigate: NavigateFunction, path: string, params?: Record<string, string>) => {
  const url = new URL(window.location.href);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  navigate(path, { replace: true });
};
