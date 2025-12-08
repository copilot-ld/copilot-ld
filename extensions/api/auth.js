/**
 * Authorizes incoming requests by validating the authorization token.
 */
export class LocalSecretAuthorizer {
  #secret;

  /**
   * Creates a new Authorizer instance
   * @param {string} secret - The secret token for authorization
   */
  constructor(secret) {
    if (!secret) throw new Error("secret is required");

    this.#secret = secret;
  }

  /**
   * Authorizes incoming requests by validating the authorization token.
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @returns {boolean} True if authorized, false otherwise
   */
  authorize(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    return token === this.#secret;
  }
}
