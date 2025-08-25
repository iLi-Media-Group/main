import { withRateLimit, apiRateLimiter, authRateLimiter, paymentRateLimiter } from './rateLimiter';
import { sanitizeFormData, isValidEmail, isValidUrl } from '../utils/sanitize';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  rateLimit?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

class SecureApi {
  private config: ApiConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.config = config;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
    };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    rateLimiter?: any
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    // Apply rate limiting if specified
    if (rateLimiter) {
      const identifier = this.getUserIdentifier();
      if (!rateLimiter.isAllowed(identifier)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Validate URL
    if (!this.isValidUrl(fullUrl)) {
      throw new Error('Invalid URL provided');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Network error');
    }
  }

  private getUserIdentifier(): string {
    // In a real app, this would get the user ID from auth context
    return `${navigator.userAgent.slice(0, 50)}_${Math.floor(Date.now() / (5 * 60 * 1000))}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private sanitizeData<T>(data: T): T {
    if (typeof data === 'object' && data !== null) {
      return sanitizeFormData(data as Record<string, any>) as T;
    }
    return data;
  }

  // Secure GET request
  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' }, apiRateLimiter);
  }

  // Secure POST request with input validation
  async post<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const sanitizedData = this.sanitizeData(data);
    
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    }, apiRateLimiter);
  }

  // Secure PUT request
  async put<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const sanitizedData = this.sanitizeData(data);
    
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(sanitizedData),
    }, apiRateLimiter);
  }

  // Secure DELETE request
  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' }, apiRateLimiter);
  }

  // Authentication-specific requests with stricter rate limiting
  async authPost<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const sanitizedData = this.sanitizeData(data);
    
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    }, authRateLimiter);
  }

  // Payment-specific requests with very strict rate limiting
  async paymentPost<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const sanitizedData = this.sanitizeData(data);
    
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    }, paymentRateLimiter);
  }

  // File upload with validation
  async uploadFile<T>(url: string, file: File, options?: RequestInit): Promise<ApiResponse<T>> {
    // Validate file type and size
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file type or size');
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...this.defaultHeaders,
        // Remove Content-Type for FormData
        'Content-Type': undefined,
      },
    }, apiRateLimiter);
  }

  private isValidFile(file: File): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
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

    return file.size <= maxSize && allowedTypes.includes(file.type);
  }
}

// Create secure API instances for different services
export const secureApi = new SecureApi({
  baseURL: import.meta.env.VITE_SUPABASE_URL || '',
  timeout: 30000,
  retries: 3,
  rateLimit: true,
});

export const stripeApi = new SecureApi({
  baseURL: 'https://api.stripe.com',
  timeout: 15000,
  retries: 2,
  rateLimit: true,
});

// Utility functions for common API patterns
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries - 1) throw lastError;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError!;
};

export const validateApiResponse = <T>(response: ApiResponse<T>): boolean => {
  return response.status >= 200 && response.status < 300;
}; 