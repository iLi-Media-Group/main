import { useState, useEffect, useCallback } from 'react';
import { useRateLimit, authRateLimiter, apiRateLimiter, paymentRateLimiter } from '../lib/rateLimiter';
import { sanitizeHtml, sanitizeText, isValidEmail, isValidUrl } from '../utils/sanitize';

interface SecurityConfig {
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableXSSProtection: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export const useSecurity = (config: Partial<SecurityConfig> = {}) => {
  const defaultConfig: SecurityConfig = {
    enableRateLimiting: true,
    enableInputValidation: true,
    enableXSSProtection: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/aac',
      'audio/ogg',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Document types for resources
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
    ],
    ...config,
  };

  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  // Rate limiting hooks
  const authRateLimit = useRateLimit(authRateLimiter);
  const apiRateLimit = useRateLimit(apiRateLimiter);
  const paymentRateLimit = useRateLimit(paymentRateLimiter);

  // Input validation
  const validateInput = useCallback((input: string, type: 'email' | 'url' | 'text'): boolean => {
    if (!defaultConfig.enableInputValidation) return true;

    switch (type) {
      case 'email':
        return isValidEmail(input);
      case 'url':
        return isValidUrl(input);
      case 'text':
        return input.length <= 10000; // Max 10KB text
      default:
        return true;
    }
  }, [defaultConfig.enableInputValidation]);

  // XSS Protection
  const sanitizeInput = useCallback((input: string, type: 'html' | 'text'): string => {
    if (!defaultConfig.enableXSSProtection) return input;

    switch (type) {
      case 'html':
        return sanitizeHtml(input);
      case 'text':
        return sanitizeText(input);
      default:
        return input;
    }
  }, [defaultConfig.enableXSSProtection]);

  // File validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (file.size > defaultConfig.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${Math.round(defaultConfig.maxFileSize / (1024 * 1024))}MB limit`,
      };
    }

    if (!defaultConfig.allowedFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { isValid: true };
  }, [defaultConfig.maxFileSize, defaultConfig.allowedFileTypes]);

  // Security monitoring
  const logSecurityViolation = useCallback((violation: string) => {
    setSecurityViolations(prev => [...prev, `${new Date().toISOString()}: ${violation}`]);
    
    // Block user if too many violations
    if (securityViolations.length >= 5) {
      setIsBlocked(true);
    }
  }, [securityViolations.length]);

  // Secure form submission
  const secureSubmit = useCallback(async (
    formData: Record<string, any>,
    submitFn: (data: Record<string, any>) => Promise<any>
  ) => {
    try {
      // Check rate limiting
      if (defaultConfig.enableRateLimiting && !apiRateLimit.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      // Validate and sanitize form data
      const sanitizedData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          // Validate input
          if (!validateInput(value, 'text')) {
            logSecurityViolation(`Invalid input in field: ${key}`);
            throw new Error(`Invalid input in field: ${key}`);
          }
          
          // Sanitize input
          sanitizedData[key] = sanitizeInput(value, 'text');
        } else {
          sanitizedData[key] = value;
        }
      }

      // Submit form
      const result = await submitFn(sanitizedData);
      return result;
    } catch (error) {
      logSecurityViolation(`Form submission error: ${error}`);
      throw error;
    }
  }, [
    defaultConfig.enableRateLimiting,
    apiRateLimit,
    validateInput,
    sanitizeInput,
    logSecurityViolation,
  ]);

  // Secure file upload
  const secureFileUpload = useCallback(async (
    file: File,
    uploadFn: (file: File) => Promise<any>
  ) => {
    try {
      // Check rate limiting
      if (defaultConfig.enableRateLimiting && !apiRateLimit.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        logSecurityViolation(`File validation failed: ${validation.error}`);
        throw new Error(validation.error);
      }

      // Upload file
      const result = await uploadFn(file);
      return result;
    } catch (error) {
      logSecurityViolation(`File upload error: ${error}`);
      throw error;
    }
  }, [
    defaultConfig.enableRateLimiting,
    apiRateLimit,
    validateFile,
    logSecurityViolation,
  ]);

  // Secure authentication
  const secureAuth = useCallback(async (
    credentials: { email: string; password: string },
    authFn: (credentials: { email: string; password: string }) => Promise<any>
  ) => {
    try {
      // Check rate limiting
      if (defaultConfig.enableRateLimiting && !authRateLimit.checkRateLimit()) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Validate email
      if (!validateInput(credentials.email, 'email')) {
        logSecurityViolation('Invalid email format during login');
        throw new Error('Invalid email format');
      }

      // Sanitize credentials
      const sanitizedCredentials = {
        email: sanitizeInput(credentials.email, 'text'),
        password: credentials.password, // Don't sanitize passwords
      };

      // Perform authentication
      const result = await authFn(sanitizedCredentials);
      return result;
    } catch (error) {
      logSecurityViolation(`Authentication error: ${error}`);
      throw error;
    }
  }, [
    defaultConfig.enableRateLimiting,
    authRateLimit,
    validateInput,
    sanitizeInput,
    logSecurityViolation,
  ]);

  // Secure payment
  const securePayment = useCallback(async (
    paymentData: Record<string, any>,
    paymentFn: (data: Record<string, any>) => Promise<any>
  ) => {
    try {
      // Check rate limiting
      if (defaultConfig.enableRateLimiting && !paymentRateLimit.checkRateLimit()) {
        throw new Error('Too many payment attempts. Please try again later.');
      }

      // Validate payment data
      const sanitizedData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(paymentData)) {
        if (typeof value === 'string') {
          sanitizedData[key] = sanitizeInput(value, 'text');
        } else {
          sanitizedData[key] = value;
        }
      }

      // Process payment
      const result = await paymentFn(sanitizedData);
      return result;
    } catch (error) {
      logSecurityViolation(`Payment error: ${error}`);
      throw error;
    }
  }, [
    defaultConfig.enableRateLimiting,
    paymentRateLimit,
    sanitizeInput,
    logSecurityViolation,
  ]);

  // Clear security violations
  const clearViolations = useCallback(() => {
    setSecurityViolations([]);
    setIsBlocked(false);
  }, []);

  // Get rate limit info
  const getRateLimitInfo = () => ({
    auth: authRateLimit.getRateLimitInfo(),
    api: apiRateLimit.getRateLimitInfo(),
    payment: paymentRateLimit.getRateLimitInfo(),
  });

  return {
    // Security functions
    validateInput,
    sanitizeInput,
    validateFile,
    secureSubmit,
    secureFileUpload,
    secureAuth,
    securePayment,
    
    // Rate limiting
    getRateLimitInfo,
    
    // Security monitoring
    securityViolations,
    isBlocked,
    clearViolations,
    logSecurityViolation,
  };
}; 