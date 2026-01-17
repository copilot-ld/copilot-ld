import { AuthMiddleware } from "./auth.js";
import { CorsMiddleware } from "./cors.js";
import { ValidationMiddleware } from "./validation.js";

export { AuthMiddleware } from "./auth.js";
export { CorsMiddleware } from "./cors.js";
export { ValidationMiddleware } from "./validation.js";

/**
 * Factory function to create validation middleware
 * @param {import("@copilot-ld/libconfig").Config} [config] - Extension configuration object (optional)
 * @returns {ValidationMiddleware} Validation middleware instance
 */
export function createValidationMiddleware(config = null) {
  return new ValidationMiddleware(config);
}

/**
 * Factory function to create CORS middleware
 * @param {import("@copilot-ld/libconfig").Config} [config] - Extension configuration object (optional)
 * @returns {CorsMiddleware} CORS middleware instance
 */
export function createCorsMiddleware(config = null) {
  return new CorsMiddleware(config);
}

/**
 * Factory function to create authentication middleware
 * @param {import("@copilot-ld/libconfig").Config} config - Extension configuration object
 * @returns {AuthMiddleware} Authentication middleware instance
 */
export function createAuthMiddleware(config) {
  return new AuthMiddleware(config);
}
