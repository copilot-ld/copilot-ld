#!/usr/bin/env node
/* eslint-env node */
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { parseArgs } from "node:util";

/**
 * Generates a self-signed certificate for localhost development
 * Creates certificate and key files in data/cert/ directory
 */
function main() {
  const { values } = parseArgs({
    options: {
      force: {
        type: "boolean",
        short: "f",
        default: false,
      },
    },
  });

  const certDir = join(process.cwd(), "data", "cert");
  const certPath = join(certDir, "localhost.crt");
  const keyPath = join(certDir, "localhost.key");

  // Create directory if it doesn't exist
  if (!existsSync(certDir)) {
    mkdirSync(certDir, { recursive: true });
    console.log(`Created directory: ${certDir}`);
  }

  const force = values.force;

  // Check if certificate already exists
  if ((existsSync(certPath) || existsSync(keyPath)) && !force) {
    console.log("SSL certificate files exist. Use --force to regenerate.");
    return;
  }

  console.log("Generating self-signed certificate for localhost...");

  try {
    // Generate private key and certificate in one command
    const opensslCommand = [
      "openssl req -x509 -newkey rsa:4096 -keyout",
      keyPath,
      "-out",
      certPath,
      "-sha256 -days 365 -nodes",
      "-subj '/C=US/ST=Development/L=Local/O=Copilot-LD/CN=localhost'",
      "-addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'",
    ].join(" ");

    execSync(opensslCommand, { stdio: "inherit" });

    console.log("SSL certificate generated successfully");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
