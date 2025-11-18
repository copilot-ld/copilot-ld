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
  // CompanyAdministrator: 62e90394-69f5-4237-9190-012177145e10
  // TeamsServiceAdministrator: 29232cdf-9323-42fd-ade2-1d097af3e4de
  const adminRoleIds = [
    "62e90394-69f5-4237-9190-012177145e10",
    "29232cdf-9323-42fd-ade2-1d097af3e4de",
  ];
  const userRoles = [].concat(claims.roles || [], claims.wids || []);
  return userRoles.some((role) => adminRoleIds.includes(role));
}
