/* eslint-env node */
import { cors } from "hono/cors";
import validator from "validator";

import { ExtensionConfig } from "@copilot-ld/libconfig";

/**
 * Simple request validation implementation
 */
export class RequestValidator {
  /**
   * Validates request data against schema
   * @param {object} data - Data to validate
   * @returns {object} Validation result with isValid and errors
   */
  validate(data) {
    const errors = [];

    if (!data || typeof data !== "object") {
      return { isValid: false, errors: ["Request data must be an object"] };
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Memory-based rate limiter implementation
 */
export class MemoryRateLimiter {
  #requests;
  #windowMs;
  #maxRequests;
  #cleanupInterval;

  /**
   * Creates memory-based rate limiter
   * @param {object} options - Rate limiting options
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {number} options.maxRequests - Maximum requests per window
   */
  constructor(options = {}) {
    this.#requests = new Map();
    this.#windowMs = options.windowMs || 60000; // 1 minute default
    this.#maxRequests = options.maxRequests || 100; // 100 requests default

    // Clean up expired entries every minute
    this.#cleanupInterval = setInterval(() => this.#cleanup(), 60000);
    this.#cleanupInterval.unref(); // Allow process to exit even with active interval
  }

  /**
   * Checks if request should be rate limited
   * @param {string} key - Identifier for the request (IP, user ID, etc.)
   * @returns {Promise<object>} Result with allowed, remaining, and resetTime
   */
  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.#windowMs;

    if (!this.#requests.has(key)) {
      this.#requests.set(key, []);
    }

    const requests = this.#requests.get(key);

    // Remove expired requests
    const validRequests = requests.filter((time) => time > windowStart);
    this.#requests.set(key, validRequests);

    if (validRequests.length >= this.#maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + this.#windowMs,
      };
    }

    // Add current request
    validRequests.push(now);

    return {
      allowed: true,
      remaining: this.#maxRequests - validRequests.length,
      resetTime: now + this.#windowMs,
    };
  }

  /**
   * Resets rate limit for a key
   * @param {string} key - Identifier to reset
   * @returns {Promise<void>}
   */
  async reset(key) {
    this.#requests.delete(key);
  }

  /**
   * Cleanup and dispose of the rate limiter
   */
  dispose() {
    if (this.#cleanupInterval) {
      clearInterval(this.#cleanupInterval);
      this.#cleanupInterval = null;
    }
  }

  /**
   * Cleanup expired entries
   * @private
   */
  #cleanup() {
    const now = Date.now();
    const windowStart = now - this.#windowMs;

    for (const [key, requests] of this.#requests.entries()) {
      const validRequests = requests.filter((time) => time > windowStart);
      if (validRequests.length === 0) {
        this.#requests.delete(key);
      } else {
        this.#requests.set(key, validRequests);
      }
    }
  }
}

/**
 * Security middleware implementation for Hono
 */
export class SecurityMiddleware {
  #rateLimiter;

  /**
   * Creates security middleware instance
   * @param {object} rateLimiter - Rate limiter implementation
   */
  constructor(rateLimiter) {
    this.#rateLimiter = rateLimiter;
  }

  /**
   * Creates input validation middleware
   * @param {object} schema - Validation schema
   * @returns {Function} Hono middleware function
   */
  createValidationMiddleware(schema) {
    return async (c, next) => {
      try {
        const data = await c.req.json();
        if (!data || typeof data !== "object") {
          return c.json({ error: "Invalid request data" }, 400);
        }

        // Validate required fields, types, and lengths in one pass
        for (const [field, value] of Object.entries(data)) {
          // Required field validation
          if (
            schema.required?.includes(field) &&
            (value === undefined || value === null)
          ) {
            return c.json({ error: `Missing required field: ${field}` }, 400);
          }

          // Type validation
          const expectedType = schema.types?.[field];
          if (expectedType && value !== undefined && value !== null) {
            const typeChecks = {
              string: typeof value === "string",
              number: typeof value === "number",
              array: Array.isArray(value),
            };
            if (!typeChecks[expectedType]) {
              return c.json(
                { error: `Field ${field} must be a ${expectedType}` },
                400,
              );
            }
          }

          // Length validation
          const maxLength = schema.maxLengths?.[field];
          if (
            maxLength &&
            typeof value === "string" &&
            value.length > maxLength
          ) {
            return c.json(
              {
                error: `Field ${field} exceeds maximum length of ${maxLength}`,
              },
              400,
            );
          }
        }

        // Check for missing required fields
        if (schema.required) {
          for (const field of schema.required) {
            if (!(field in data)) {
              return c.json({ error: `Missing required field: ${field}` }, 400);
            }
          }
        }

        // Sanitize string fields
        const sanitizedData = {};
        for (const [key, value] of Object.entries(data)) {
          sanitizedData[key] =
            typeof value === "string" ? validator.escape(value) : value;
        }

        c.set("validatedData", sanitizedData);
        await next();
      } catch (error) {
        console.error("Validation error:", error.message);
        return c.json({ error: "Invalid request format" }, 400);
      }
    };
  }

  /**
   * Creates rate limiting middleware
   * @param {object} options - Rate limiting options
   * @returns {Function} Hono middleware function
   */
  createRateLimitMiddleware(options = {}) {
    return async (c, next) => {
      const key = this.#getRateLimitKey(c, options);
      const result = await this.#rateLimiter.checkLimit(key);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        return c.json({ error: "Rate limit exceeded", retryAfter }, 429, {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetTime.toString(),
        });
      }

      // Add rate limit headers
      c.header("X-RateLimit-Remaining", result.remaining.toString());
      c.header("X-RateLimit-Reset", result.resetTime.toString());

      await next();
    };
  }

  /**
   * Creates CORS middleware
   * @param {object} options - CORS options
   * @returns {Function} Hono middleware function
   */
  createCorsMiddleware(options = {}) {
    const defaultOptions = {
      origin: ["http://localhost:3000"],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type", "X-GitHub-Token"],
    };

    return cors({ ...defaultOptions, ...options });
  }

  /**
   * Creates error handling middleware
   * @returns {Function} Hono middleware function
   */
  createErrorMiddleware() {
    return async (c, next) => {
      try {
        await next();
      } catch (error) {
        console.error("Request error:", {
          error: error.message,
          path: c.req.path,
          method: c.req.method,
        });

        // Sanitize error message
        const sanitizedMessage = this.#sanitizeErrorMessage(error.message);

        return c.json({ error: sanitizedMessage }, 500);
      }
    };
  }

  /**
   * Gets rate limit key from request
   * @param {object} c - Hono context
   * @param {object} options - Rate limit options
   * @returns {string} Rate limit key
   * @private
   */
  #getRateLimitKey(c, options) {
    if (options.keyGenerator) {
      return options.keyGenerator(c);
    }

    // Default to IP address
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : c.req.header("x-real-ip") || "unknown";

    return `ip:${ip}`;
  }

  /**
   * Sanitizes error messages to prevent information disclosure
   * @param {string} message - Original error message
   * @returns {string} Sanitized error message
   * @private
   */
  #sanitizeErrorMessage(message) {
    return message
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]")
      .replace(/[a-zA-Z0-9]{32,}/g, "[TOKEN]")
      .replace(/\/[^\s]+/g, "[PATH]");
  }
}

/**
 * Factory function to create rate limiter with default settings
 * @param {object} options - Rate limiter options
 * @returns {MemoryRateLimiter} Configured rate limiter
 */
export function createRateLimiter(options = {}) {
  return new MemoryRateLimiter(options);
}

/**
 * Factory function to create security middleware with default rate limiter
 * @param {ExtensionConfig} config - Extension configuration object
 * @returns {SecurityMiddleware} Configured security middleware
 */
export function createSecurityMiddleware(config) {
  if (!(config instanceof ExtensionConfig)) {
    throw new Error("config must be an ExtensionConfig instance");
  }

  // Use default rate limiting values or from config
  const rateLimitOptions = {
    windowMs: config.rateLimitWindowMs || 60000,
    maxRequests: config.rateLimitMaxRequests || 100,
  };

  const rateLimiter = createRateLimiter(rateLimitOptions);
  return new SecurityMiddleware(rateLimiter);
}

// Export all interfaces and implementations
