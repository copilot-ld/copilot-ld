#!/usr/bin/env node
/* eslint-env node */
/**
 * HTML5 validation script.
 * Reads a list of file paths (one per line) from stdin and validates each as HTML5.
 * Only performs structural HTML5 validation; no custom business logic.
 *
 * Usage:
 * Usage example (bash):
 * find eval/output -name "*.html" | node scripts/validate.js
 */
import fs from "node:fs";
import readline from "node:readline";
import process from "node:process";
import { HtmlValidate } from "html-validate";

// Configure html-validate for strict HTML5 without accessibility or stylistic rules.
const htmlvalidate = new HtmlValidate({
  root: true,
  extends: ["html-validate:recommended"],
  rules: {
    // Disable non-HTML structural extras if present in recommended set
    "no-inline-style": "off",
    "prefer-button": "off",
    "wcag/h30": "off",
  },
});

/**
 * Read newline-delimited filenames from stdin.
 * @returns {Promise<string[]>} list of file paths
 */
async function readFilenamesFromStdin() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });
  const files = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) files.push(trimmed);
  }
  return files;
}

/**
 * Validate a single HTML file.
 * @param {string} path absolute or relative file path
 * @returns {import('html-validate').Report} validation report
 */
function validateFile(path) {
  const source = fs.readFileSync(path, "utf8");
  // Use validateString for consistency but do not pass unknown config keys.
  const report = htmlvalidate.validateString(source);
  // Attach filePath manually to each message for output clarity.
  if (report && !report.valid && Array.isArray(report.results)) {
    for (const result of report.results) {
      if (!result.filePath) result.filePath = path;
      for (const msg of result.messages) {
        if (!msg.filePath) msg.filePath = path;
      }
    }
  } else if (report && Array.isArray(report.messages)) {
    for (const msg of report.messages) {
      if (!msg.filePath) msg.filePath = path;
    }
  }
  return report;
}

/**
 * Convert a validation report into printable error lines.
 * @param {import('html-validate').Report} report Validation report object.
 * @returns {string | null} Joined error lines or null if report is valid.
 */
function formatReport(report) {
  if (report.valid) return null;
  const results = Array.isArray(report.results) ? report.results : [];
  if (!results.length) {
    // Fallback: older/newer API may expose aggregated messages directly
    const messages = report.messages || [];
    return messages
      .map(
        (m) =>
          `${m.filePath || "unknown"}:${m.line}:${m.column} ${m.ruleId} ${m.message}`,
      )
      .join("\n");
  }
  return results
    .map((r) =>
      (r.messages || [])
        .map(
          (m) => `${r.filePath}:${m.line}:${m.column} ${m.ruleId} ${m.message}`,
        )
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n");
}

(async () => {
  const files = await readFilenamesFromStdin();
  if (!files.length) {
    console.error("No input files provided on stdin.");
    process.exit(1);
  }

  let errorCount = 0;
  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) {
        console.warn(`Skipping non-file path: ${file}`);
        continue;
      }
      const report = validateFile(file);
      const formatted = formatReport(report);
      if (formatted) {
        console.log(formatted);
        errorCount += report.errorCount || 1; // ensure non-zero increment
      } else {
        console.log(`${file}: OK`);
      }
    } catch (err) {
      console.error(`${file}: ERROR reading file - ${err.message}`);
      errorCount += 1;
    }
  }

  if (errorCount > 0) {
    console.error(`\nValidation failed with ${errorCount} error(s).`);
    process.exit(2);
  } else {
    console.log("\nAll files passed HTML5 validation.");
  }
})();
