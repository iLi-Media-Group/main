interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private generateKey(identifier: string): string {
    return this.config.keyGenerator 
      ? this.config.keyGenerator(identifier)
      : `rate_limit_${identifier}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  isAllowed(identifier: string): boolean {
    this.cleanup();
    
    const key = this.generateKey(identifier);
    const now = Date.now();
    
    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return true;
    }

    if (now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return true;
    }

    if (this.store[key].count >= this.config.maxRequests) {
      return false;
    }

    this.store[key].count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const key = this.generateKey(identifier);
    const entry = this.store[key];
    
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  getRemainingRequests(identifier: string): number {
    const key = this.generateKey(identifier);
    const entry = this.store[key];
    
    if (!entry) return this.config.maxRequests;
    
    return Math.max(0, this.config.maxRequests - entry.count);
  }
}

// Predefined rate limiters for different use cases
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (identifier) => `auth_${identifier}`
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (identifier) => `api_${identifier}`
});

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (identifier) => `upload_${identifier}`
});

export const paymentRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (identifier) => `payment_${identifier}`
});

// Utility function to get user identifier
export const getUserIdentifier = (): string => {
  // In a real app, this would get the user ID from auth context
  // For now, we'll use a combination of user agent and timestamp
  return `${navigator.userAgent.slice(0, 50)}_${Math.floor(Date.now() / (5 * 60 * 1000))}`;
};

// Decorator for rate limiting API calls
export const withRateLimit = <T extends any[], R>(
  rateLimiter: RateLimiter,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const identifier = getUserIdentifier();
    
    if (!rateLimiter.isAllowed(identifier)) {
      const remainingTime = rateLimiter.getRemainingTime(identifier);
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(remainingTime / 1000)} seconds.`);
    }
    
    return fn(...args);
  };
};

// Hook for rate limiting in React components
export const useRateLimit = (rateLimiter: RateLimiter) => {
  const checkRateLimit = (): boolean => {
    const identifier = getUserIdentifier();
    return rateLimiter.isAllowed(identifier);
  };

  const getRateLimitInfo = () => {
    const identifier = getUserIdentifier();
    return {
      remaining: rateLimiter.getRemainingRequests(identifier),
      resetTime: rateLimiter.getRemainingTime(identifier)
    };
  };

  return { checkRateLimit, getRateLimitInfo };
}; 