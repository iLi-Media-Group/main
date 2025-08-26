export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-DNS-Prefetch-Control': string;
  'X-Permitted-Cross-Domain-Policies': string;
}

export const getSecurityHeaders = (): SecurityHeaders => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://*.stripe.com https://maps.googleapis.com https://maps.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://maps.googleapis.com https://www.google-analytics.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google.com/recaptcha/",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
};

export const getCSPNonce = (): string => {
  // Generate a random nonce for inline scripts
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const validateCSP = (csp: string): boolean => {
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'object-src'
  ];
  
  return requiredDirectives.every(directive => 
    csp.toLowerCase().includes(directive.toLowerCase())
  );
};

export const sanitizeCSP = (csp: string): string => {
  // Remove any potentially dangerous directives
  const dangerousDirectives = [
    'unsafe-eval',
    'unsafe-inline'
  ];
  
  let sanitized = csp;
  dangerousDirectives.forEach(directive => {
    const regex = new RegExp(`\\b${directive}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
};

// Utility to check if a URL is allowed by CSP
export const isUrlAllowedByCSP = (url: string, directive: string): boolean => {
  const allowedDomains = {
    'script-src': [
      'https://www.google.com/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://maps.googleapis.com',
      'https://www.googletagmanager.com'
    ],
    'connect-src': [
      'https://*.supabase.co',
      'https://api.stripe.com',
      'https://checkout.stripe.com',
      'https://maps.googleapis.com',
      'https://www.google-analytics.com',
      'wss://*.supabase.co'
    ],
    'frame-src': [
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://www.google.com/recaptcha/'
    ]
  };
  
  const domains = allowedDomains[directive as keyof typeof allowedDomains] || [];
  return domains.some(domain => {
    if (domain.includes('*')) {
      const pattern = domain.replace('*', '.*');
      return new RegExp(pattern).test(url);
    }
    return url.startsWith(domain);
  });
}; 