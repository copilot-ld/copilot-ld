#!/usr/bin/env node
import { parseArgs } from "node:util";

const SUPABASE_AUTH_URL =
  process.env.SUPABASE_AUTH_URL || "http://localhost:9999";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates a demo user via Supabase Auth admin API
 */
async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string", default: "demo@example.com" },
      password: { type: "string", default: "demo123456" },
    },
  });

  if (!SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY not set in environment");
    console.error("Run: npm run supabase:env && source .env");
    process.exit(1);
  }

  const { email, password } = values;

  console.log(`Creating demo user: ${email}`);

  const response = await fetch(`${SUPABASE_AUTH_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Demo User",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.msg?.includes("already been registered")) {
      console.log("User already exists, skipping creation");
      return;
    }
    console.error(`Failed to create user: ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const user = await response.json();
  console.log(`Created user: ${user.id}`);
  console.log(`\nDemo credentials:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
}

main();
