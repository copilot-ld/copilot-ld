import { createLogger } from "@copilot-ld/libtelemetry";

const logger = createLogger("teamsagent");

/**
 * Authorizes incoming requests by validating the authorization token.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @returns {boolean} True if authorized, false otherwise
 */
export function authorize(req) {
  const authHeader = req.headers.authorization;
  const secret = process.env.TEAMS_AGENT_SECRET;

  if (!secret) {
    logger.error(
      "authorize",
      "TEAMS_AGENT_SECRET environment variable not set",
    );
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === secret;
}
