/**
 * Authorizes a request for tenant admin access.
 * Throws on failure.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @returns {object} Decoded claims if authorized
 */
export function authorize(req) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    const err = new Error("Unauthorized: Missing bearer token");
    err.statusCode = 401;
    throw err;
  }
  const token = authHeader.slice(7);
  const claims = decodeJwt(token);
  if (!claims) {
    const err = new Error("Unauthorized: Invalid token");
    err.statusCode = 401;
    throw err;
  }
  if (!isTenantAdmin(claims)) {
    const err = new Error("Forbidden: Admins only");
    err.statusCode = 403;
    throw err;
  }
  return claims;
}
/**
 * Authentication and authorization helpers for Teams admin endpoints.
 */

/**
 * Decodes a JWT token payload (without verification).
 * @param {string} token - The JWT bearer token
 * @returns {object|null} Decoded claims or null if invalid
 */
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Checks if the claims object contains a Teams tenant admin role.
 * @param {object} claims - Decoded JWT claims
 * @returns {boolean} True if user is a tenant admin
 */
export function isTenantAdmin(claims) {
  /**
   * Checks if the claims object contains the required scope for admin actions.
   * @param {object} claims - Decoded JWT claims
   * @returns {boolean} True if user has the required scope
   */
  const requiredScope = "Settings:Update";
  // Azure AD v2 tokens use 'scp' (space-delimited string) for scopes
  if (typeof claims.scp === "string") {
    const scopes = claims.scp.split(" ");
    return scopes.includes(requiredScope);
  }
  return false;
}
