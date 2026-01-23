#!/usr/bin/env node
import {
  generateBase64Secret,
  generateJWT,
  generateSecret,
  updateEnvFile,
} from "@copilot-ld/libsecret";

/**
 * Main function to generate storage environment variables for both MinIO and Supabase
 */
async function main() {
  console.log("Generating storage environment variables...\n");

  // Generate shared JWT secret
  const jwtSecret = generateSecret(32);

  // Generate MinIO S3 keys
  const minioAccessKey = generateBase64Secret(16);
  const minioSecretKey = generateBase64Secret(32);

  // Generate Supabase S3 keys
  const supabaseAccessKey = generateBase64Secret(16);
  const supabaseSecretKey = generateBase64Secret(32);

  // JWT expiration: 10 years from now
  const jwtPayloadBase = {
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60,
  };

  // Service role key: full admin access
  const serviceRoleKey = generateJWT(
    { ...jwtPayloadBase, role: "service_role" },
    jwtSecret,
  );

  // Anonymous key: public/unauthenticated access
  const anonKey = generateJWT({ ...jwtPayloadBase, role: "anon" }, jwtSecret);

  const MINIO_ENV_FILE = ".env.storage.minio";
  const SUPABASE_ENV_FILE = ".env.storage.supabase";

  // JWT authentication (shared across all configurations)
  await updateEnvFile("JWT_SECRET", jwtSecret);

  // MinIO storage variables
  await updateEnvFile("AWS_ACCESS_KEY_ID", minioAccessKey, MINIO_ENV_FILE);
  await updateEnvFile("AWS_SECRET_ACCESS_KEY", minioSecretKey, MINIO_ENV_FILE);

  // Supabase Storage variables go in .env.storage.supabase
  await updateEnvFile(
    "AWS_ACCESS_KEY_ID",
    supabaseAccessKey,
    SUPABASE_ENV_FILE,
  );
  await updateEnvFile(
    "AWS_SECRET_ACCESS_KEY",
    supabaseSecretKey,
    SUPABASE_ENV_FILE,
  );

  // Supabase service role key for storage API (admin operations)
  await updateEnvFile(
    "SUPABASE_SERVICE_ROLE_KEY",
    serviceRoleKey,
    SUPABASE_ENV_FILE,
  );

  // Supabase anonymous key for public/frontend access
  await updateEnvFile("JWT_ANON_KEY", anonKey, SUPABASE_ENV_FILE);

  console.log("Updated .env with:");
  console.log("  JWT_SECRET");
  console.log(`\nUpdated ${MINIO_ENV_FILE} with:`);
  console.log("  AWS_ACCESS_KEY_ID");
  console.log("  AWS_SECRET_ACCESS_KEY");
  console.log(`\nUpdated ${SUPABASE_ENV_FILE} with:`);
  console.log("  AWS_ACCESS_KEY_ID");
  console.log("  AWS_SECRET_ACCESS_KEY");
  console.log("  SUPABASE_SERVICE_ROLE_KEY");
  console.log("  JWT_ANON_KEY");
}

main();
