# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the MyBeatFi application, including Content Security Policy (CSP), rate limiting, security headers, and input validation.

## 1. Content Security Policy (CSP)

### Implementation
- **Location**: `public/index.html` and `netlify.toml`
- **Purpose**: Prevents XSS attacks and controls resource loading

### CSP Directives
```html
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.google.com/recaptcha/ 
    https://www.gstatic.com/recaptcha/ 
    https://js.stripe.com 
    https://checkout.stripe.com 
    https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob: 
    https://*.stripe.com 
    https://maps.googleapis.com 
    https://maps.gstatic.com;
  connect-src 'self' 
    https://*.supabase.co 
    https://api.stripe.com 
    https://checkout.stripe.com 
    https://maps.googleapis.com 
    wss://*.supabase.co;
  frame-src 'self' 
    https://js.stripe.com 
    https://checkout.stripe.com 
    https://www.google.com/recaptcha/;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://checkout.stripe.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### Allowed Domains
- **Scripts**: Google reCAPTCHA, Stripe, Google Maps
- **Styles**: Google Fonts
- **Images**: Stripe, Google Maps, data URIs, blobs
- **Connections**: Supabase, Stripe API, Google Maps
- **Frames**: Stripe checkout, Google reCAPTCHA

## 2. Rate Limiting

### Implementation
- **Location**: `src/lib/rateLimiter.ts`
- **Purpose**: Prevent abuse and DDoS attacks

### Rate Limiters
```typescript
// Authentication: 5 requests per 15 minutes
authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

// API calls: 100 requests per minute
apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

// File uploads: 10 requests per hour
uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});

// Payments: 3 requests per 5 minutes
paymentRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 5 * 60 * 1000,
});
```

### Usage
```typescript
import { useRateLimit, authRateLimiter } from '../lib/rateLimiter';

const { checkRateLimit, getRateLimitInfo } = useRateLimit(authRateLimiter);

if (!checkRateLimit()) {
  throw new Error('Rate limit exceeded');
}
```

## 3. Security Headers

### Implementation
- **Location**: `netlify.toml` and `src/lib/securityHeaders.ts`
- **Purpose**: Additional browser security protections

### Headers Applied
```toml
X-Content-Type-Options = "nosniff"
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
X-DNS-Prefetch-Control = "off"
X-Permitted-Cross-Domain-Policies = "none"
```

### Header Purposes
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Legacy XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security**: Enforces HTTPS
- **X-DNS-Prefetch-Control**: Disables DNS prefetching
- **X-Permitted-Cross-Domain-Policies**: Restricts cross-domain policies

## 4. Input Validation and Sanitization

### Implementation
- **Location**: `src/utils/sanitize.ts` and `src/hooks/useSecurity.ts`
- **Purpose**: Prevent XSS and injection attacks

### Sanitization Functions
```typescript
// HTML sanitization
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

// Text sanitization
const sanitizeText = (text: string): string => {
  return text.replace(/[<>]/g, '');
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// URL validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

### Usage in Components
```typescript
import { useSecurity } from '../hooks/useSecurity';

const { validateInput, sanitizeInput, secureSubmit } = useSecurity();

// Validate email
if (!validateInput(email, 'email')) {
  throw new Error('Invalid email format');
}

// Sanitize HTML content
const safeContent = sanitizeInput(content, 'html');

// Secure form submission
const result = await secureSubmit(formData, submitFunction);
```

## 5. Secure API Wrapper

### Implementation
- **Location**: `src/lib/secureApi.ts`
- **Purpose**: Centralized API security with rate limiting and validation

### Features
- Rate limiting for all API calls
- Input sanitization
- URL validation
- File type and size validation
- Timeout handling
- Retry logic with exponential backoff

### Usage
```typescript
import { secureApi, stripeApi } from '../lib/secureApi';

// Secure GET request
const data = await secureApi.get('/api/tracks');

// Secure POST with validation
const result = await secureApi.post('/api/tracks', trackData);

// Secure file upload
const upload = await secureApi.uploadFile('/api/upload', file);

// Payment-specific requests
const payment = await secureApi.paymentPost('/api/payment', paymentData);
```

## 6. Security Monitoring

### Implementation
- **Location**: `src/hooks/useSecurity.ts` and `src/components/SecurityBlock.tsx`
- **Purpose**: Monitor and respond to security violations

### Features
- Violation logging
- Automatic blocking after 5 violations
- Security warning display
- Violation history tracking

### Usage
```typescript
const {
  securityViolations,
  isBlocked,
  logSecurityViolation,
  clearViolations,
} = useSecurity();

// Log violations
logSecurityViolation('Invalid input detected');

// Check if blocked
if (isBlocked) {
  return <SecurityBlock />;
}
```

## 7. File Upload Security

### Implementation
- **Location**: `src/lib/secureApi.ts` and `src/hooks/useSecurity.ts`
- **Purpose**: Secure file uploads with validation

### Validation Rules
```typescript
const allowedTypes = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/aac',
  'audio/ogg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const maxSize = 50 * 1024 * 1024; // 50MB
```

### Usage
```typescript
const { validateFile, secureFileUpload } = useSecurity();

// Validate file before upload
const validation = validateFile(file);
if (!validation.isValid) {
  throw new Error(validation.error);
}

// Secure upload
const result = await secureFileUpload(file, uploadFunction);
```

## 8. Environment Security

### Implementation
- **Location**: `vite.config.ts` and `netlify.toml`
- **Purpose**: Secure build and deployment configuration

### Build Security
```typescript
// Remove source maps in production
sourcemap: false,

// Minify and obfuscate code
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
  },
},

// Remove development code
define: {
  __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
},
```

### Deployment Security
```toml
# Block access to sensitive files
[[redirects]]
  from = "/.env*"
  to = "/404"
  status = 404

[[redirects]]
  from = "/package.json"
  to = "/404"
  status = 404
```

## 9. Security Testing

### Audit Commands
```bash
# Security audit
npm run security:audit

# Fix security vulnerabilities
npm run security:fix

# Check for outdated packages
npm outdated
```

### Manual Testing
1. **XSS Testing**: Try injecting scripts in input fields
2. **CSRF Testing**: Attempt cross-site request forgery
3. **Rate Limiting**: Make rapid requests to test limits
4. **File Upload**: Try uploading malicious files
5. **CSP Testing**: Check browser console for CSP violations

## 10. Monitoring and Logging

### Security Events to Monitor
- Rate limit violations
- Invalid file uploads
- XSS attempts
- Authentication failures
- Suspicious navigation patterns

### Logging Format
```typescript
const logSecurityViolation = (violation: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${violation}`;
  // Log to monitoring service
};
```

## 11. Best Practices

### Development
1. Always use the security hooks in components
2. Validate all user inputs
3. Sanitize HTML content before rendering
4. Use secure API wrapper for all requests
5. Implement proper error handling

### Deployment
1. Enable HTTPS everywhere
2. Set up security headers
3. Configure CSP properly
4. Monitor security violations
5. Regular security audits

### Maintenance
1. Keep dependencies updated
2. Monitor security advisories
3. Regular penetration testing
4. Security incident response plan
5. User security education

## 12. Troubleshooting

### Common Issues
1. **CSP Violations**: Check browser console for blocked resources
2. **Rate Limiting**: Monitor rate limit info in security hook
3. **File Upload Errors**: Verify file type and size limits
4. **Blocked Users**: Check security violations log

### Debug Commands
```typescript
// Check rate limit status
const rateLimitInfo = getRateLimitInfo();
console.log('Rate limit info:', rateLimitInfo);

// Check security violations
console.log('Security violations:', securityViolations);

// Test CSP
console.log('CSP enabled:', validateCSP(cspString));
```

## 13. Future Enhancements

### Planned Features
1. **Web Application Firewall (WAF)**: Server-side protection
2. **Behavioral Analysis**: AI-powered threat detection
3. **Two-Factor Authentication**: Enhanced account security
4. **Security Score**: User security assessment
5. **Automated Security Testing**: CI/CD integration

### Monitoring Improvements
1. **Real-time Alerts**: Instant security notifications
2. **Threat Intelligence**: External threat feeds
3. **User Behavior Analytics**: Anomaly detection
4. **Security Dashboard**: Admin security overview
5. **Compliance Reporting**: Security audit reports 