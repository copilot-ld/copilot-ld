#!/usr/bin/env node
import crypto from "crypto";
import { updateEnvFile } from "@copilot-ld/libutil";

/**
 * Generates a cryptographically secure random string
 * @param {number} length - Length in bytes
 * @returns {string} Hex-encoded string
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generates a base64url-encoded random string
 * @param {number} length - Length in bytes
 * @returns {string} Base64url-encoded string
 */
function generateBase64Secret(length = 32) {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Creates an HS256-signed JWT
 * @param {object} payload - JWT payload
 * @param {string} secret - Signing secret
 * @returns {string} Signed JWT
 */
function createJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Main function to generate Supabase environment variables
 */
async function main() {
  console.log("Generating Supabase environment variables...\n");

  const dbPassword = generateSecret(16);
  const jwtSecret = generateSecret(32);
  const s3AccessKey = generateBase64Secret(16);
  const s3SecretKey = generateBase64Secret(32);

  const anonKey = createJwt(
    {
      role: "anon",
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60,
    },
    jwtSecret,
  );

  const serviceRoleKey = createJwt(
    {
      role: "service_role",
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60,
    },
    jwtSecret,
  );

  await updateEnvFile("SUPABASE_DB_PASSWORD", dbPassword);
  await updateEnvFile("SUPABASE_JWT_SECRET", jwtSecret);
  await updateEnvFile("SUPABASE_ANON_KEY", anonKey);
  await updateEnvFile("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
  await updateEnvFile("SUPABASE_S3_ACCESS_KEY", s3AccessKey);
  await updateEnvFile("SUPABASE_S3_SECRET_KEY", s3SecretKey);
  await updateEnvFile("SUPABASE_SITE_URL", "http://localhost:3000");
  await updateEnvFile("SUPABASE_DISABLE_SIGNUP", "false");
  await updateEnvFile("JWT_SECRET", jwtSecret);

  console.log("Updated .env with:");
  console.log("  SUPABASE_DB_PASSWORD");
  console.log("  SUPABASE_JWT_SECRET");
  console.log("  SUPABASE_ANON_KEY");
  console.log("  SUPABASE_SERVICE_ROLE_KEY");
  console.log("  SUPABASE_S3_ACCESS_KEY");
  console.log("  SUPABASE_S3_SECRET_KEY");
  console.log("  SUPABASE_SITE_URL");
  console.log("  SUPABASE_DISABLE_SIGNUP");
  console.log("  JWT_SECRET");
}

main();
