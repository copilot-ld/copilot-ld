/**
 * Interface for request validation schemas
 */
export class ValidationInterface {
  /**
   * Validates request data against schema
   * @param {object} data - Data to validate
   * @throws {Error} When interface method is not implemented
   */
  validate(data) {
    throw new Error("Not implemented");
  }
}

/**
 * Interface for rate limiting implementations
 */
export class RateLimiterInterface {
  /**
   * Checks if request should be rate limited
   * @param {string} key - Identifier for the request (IP, user ID, etc.)
   * @throws {Error} When interface method is not implemented
   */
  async checkLimit(key) {
    throw new Error("Not implemented");
  }

  /**
   * Resets rate limit for a key
   * @param {string} key - Identifier to reset
   * @throws {Error} When interface method is not implemented
   */
  async reset(key) {
    throw new Error("Not implemented");
  }

  /**
   * Cleanup and dispose of the rate limiter
   * @throws {Error} When interface method is not implemented
   */
  dispose() {
    throw new Error("Not implemented");
  }
}

/**
 * Interface for security middleware implementations
 */
export class SecurityMiddlewareInterface {
  /**
   * Creates input validation middleware
   * @param {object} schema - Validation schema
   * @throws {Error} When interface method is not implemented
   */
  createValidationMiddleware(schema) {
    throw new Error("Not implemented");
  }

  /**
   * Creates rate limiting middleware
   * @param {object} options - Rate limiting options
   * @throws {Error} When interface method is not implemented
   */
  createRateLimitMiddleware(options) {
    throw new Error("Not implemented");
  }

  /**
   * Creates CORS middleware
   * @param {object} options - CORS options
   * @throws {Error} When interface method is not implemented
   */
  createCorsMiddleware(options) {
    throw new Error("Not implemented");
  }

  /**
   * Creates error handling middleware
   * @throws {Error} When interface method is not implemented
   */
  createErrorMiddleware() {
    throw new Error("Not implemented");
  }
}
