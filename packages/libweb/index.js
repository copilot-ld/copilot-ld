import { createHmac } from "node:crypto";

import { cors } from "hono/cors";

import { Config } from "@copilot-ld/libconfig";

/**
 * Simple HTML escape function to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * @typedef {object} Middleware
 * @property {Function} create - Creates middleware function for Hono
 */

/**
 * Validation middleware implementation for Hono
 * @implements {Middleware}
 */
export class ValidationMiddleware {
  /**
   * Creates validation middleware instance
   * @param {Config} [_config] - Extension configuration object
   */
  constructor(_config = null) {}

  /**
   * Validates required fields in data
   * @param {object} data - Data to validate
   * @param {object} schema - Validation schema
   * @returns {string|null} Error message or null if valid
   */
  #validateRequiredFields(data, schema) {
    if (!schema.required) return null;

    for (const field of schema.required) {
      if (
        !(field in data) ||
        data[field] === undefined ||
        data[field] === null
      ) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Validates field types in data
   * @param {object} data - Data to validate
   * @param {object} schema - Validation schema
   * @returns {string|null} Error message or null if valid
   */
  #validateFieldTypes(data, schema) {
    if (!schema.types) return null;

    for (const [field, value] of Object.entries(data)) {
      const expectedType = schema.types[field];
      if (!expectedType || value === undefined || value === null) continue;

      const typeChecks = {
        string: typeof value === "string",
        number: typeof value === "number",
        array: Array.isArray(value),
      };

      if (!typeChecks[expectedType]) {
        return `Field ${field} must be a ${expectedType}`;
      }
    }
    return null;
  }

  /**
   * Validates field lengths in data
   * @param {object} data - Data to validate
   * @param {object} schema - Validation schema
   * @returns {string|null} Error message or null if valid
   */
  #validateFieldLengths(data, schema) {
    if (!schema.maxLengths) return null;

    for (const [field, value] of Object.entries(data)) {
      const maxLength = schema.maxLengths[field];
      if (!maxLength || typeof value !== "string") continue;

      if (value.length > maxLength) {
        return `Field ${field} exceeds maximum length of ${maxLength}`;
      }
    }
    return null;
  }

  /**
   * Sanitizes string fields in data
   * @param {object} data - Data to sanitize
   * @returns {object} Sanitized data
   */
  #sanitizeData(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = typeof value === "string" ? escapeHtml(value) : value;
    }
    return sanitized;
  }

  /**
   * Creates input validation middleware
   * @param {object} schema - Validation schema
   * @returns {Function} Hono middleware function
   */
  create(schema) {
    return async (c, next) => {
      const data = await c.req.json();
      if (!data || typeof data !== "object") {
        return c.json({ error: "Invalid request data" }, 400);
      }

      const requiredError = this.#validateRequiredFields(data, schema);
      if (requiredError) {
        return c.json({ error: requiredError }, 400);
      }

      const typeError = this.#validateFieldTypes(data, schema);
      if (typeError) {
        return c.json({ error: typeError }, 400);
      }

      const lengthError = this.#validateFieldLengths(data, schema);
      if (lengthError) {
        return c.json({ error: lengthError }, 400);
      }

      const sanitizedData = this.#sanitizeData(data);
      c.set("validatedData", sanitizedData);
      await next();
    };
  }
}

/**
 * CORS middleware implementation for Hono
 * @implements {Middleware}
 */
export class CorsMiddleware {
  /**
   * Creates CORS middleware instance
   * @param {Config} [_config] - Extension configuration object
   */
  constructor(_config = null) {}

  /**
   * Creates CORS middleware
   * @param {object} options - CORS options
   * @returns {Function} Hono middleware function
   */
  create(options = {}) {
    const defaultOptions = {
      origin: ["http://localhost:3000"],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type", "X-GitHub-Token"],
    };

    return cors({ ...defaultOptions, ...options });
  }
}

/**
 * Factory function to create validation middleware
 * @param {Config} [config] - Extension configuration object (optional)
 * @returns {ValidationMiddleware} Validation middleware instance
 */
export function createValidationMiddleware(config = null) {
  return new ValidationMiddleware(config);
}

/**
 * Factory function to create CORS middleware
 * @param {Config} [config] - Extension configuration object (optional)
 * @returns {CorsMiddleware} CORS middleware instance
 */
export function createCorsMiddleware(config = null) {
  return new CorsMiddleware(config);
}

/**
 * @typedef {object} AuthUser
 * @property {string} id - User ID (sub claim)
 * @property {string} [email] - User email
 * @property {string} role - User role
 */

/**
 * Authentication middleware implementation for Hono using HS256-signed JWT
 * @implements {Middleware}
 */
export class AuthMiddleware {
  #jwtSecret;

  /**
   * Creates authentication middleware instance
   * @param {Config} config - Extension configuration object
   */
  constructor(config) {
    if (!config) throw new Error("config is required");
    const secret = config.jwtSecret?.();
    if (!secret) throw new Error("JWT_SECRET environment variable is required");
    this.#jwtSecret = secret;
  }

  /**
   * Verifies an HS256-signed JWT token
   * @param {string} token - The JWT token to verify
   * @returns {{ valid: boolean, user?: AuthUser, error?: string }} Verification result with user data or error
   */
  #verifyToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return { valid: false, error: "Invalid token format" };
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Decode and validate header
      const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
      if (header.alg !== "HS256") {
        return { valid: false, error: "Invalid algorithm" };
      }

      // Verify signature (HS256)
      const expectedSignature = createHmac("sha256", this.#jwtSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

      if (signatureB64 !== expectedSignature) {
        return { valid: false, error: "Invalid signature" };
      }

      // Decode and parse payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString(),
      );

      const now = Math.floor(Date.now() / 1000);

      // Check expiration (required)
      if (!payload.exp) {
        return { valid: false, error: "Token missing expiration" };
      }
      if (payload.exp < now) {
        return { valid: false, error: "Token expired" };
      }

      // Check issued at (reject tokens from the future with 5 min tolerance)
      if (payload.iat && payload.iat > now + 300) {
        return { valid: false, error: "Token issued in the future" };
      }

      // Check audience
      if (payload.aud !== "authenticated") {
        return { valid: false, error: "Invalid audience" };
      }

      return {
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        },
      };
    } catch {
      return { valid: false, error: "Token verification failed" };
    }
  }

  /**
   * Creates authentication middleware
   * @param {object} [options] - Middleware options
   * @param {boolean} [options.optional] - If true, allows unauthenticated requests
   * @returns {Function} Hono middleware function
   */
  create(options = {}) {
    const { optional = false } = options;

    return async (c, next) => {
      const authHeader = c.req.header("Authorization");

      if (!authHeader?.startsWith("Bearer ")) {
        if (optional) {
          c.set("user", null);
          await next();
          return;
        }
        return c.json({ error: "Missing authorization header" }, 401);
      }

      const token = authHeader.slice(7);
      const result = this.#verifyToken(token);

      if (!result.valid) {
        if (optional) {
          c.set("user", null);
          await next();
          return;
        }
        return c.json({ error: result.error }, 401);
      }

      c.set("user", result.user);
      await next();
    };
  }
}

/**
 * Factory function to create authentication middleware
 * @param {Config} config - Extension configuration object
 * @returns {AuthMiddleware} Authentication middleware instance
 */
export function createAuthMiddleware(config) {
  return new AuthMiddleware(config);
}
