/* eslint-env node */
import { globSync } from "glob";
import { readFileSync, writeFileSync, existsSync } from "fs";

import { ReleaseLog } from "@copilot-ld/librel";

/**
 * Main function to handle CLI arguments and execute release log operations
 */
async function main() {
  const args = process.argv.slice(2);
  const path = args[0];
  const note = args[1];
  const date = args[2]; // Optional date parameter

  if (!path || !note) {
    console.error("Usage: release-log <path> <note> [date]");
    console.error(
      "  path: Path or glob pattern to search for CHANGELOG.md files",
    );
    console.error("  note: Note to add as a bullet point");
    console.error(
      "  date: Optional date (defaults to today in YYYY-MM-DD format)",
    );
    process.exit(1);
  }

  try {
    const releaseLog = new ReleaseLog(
      globSync,
      readFileSync,
      writeFileSync,
      existsSync,
    );
    const updatedFiles = await releaseLog.addNote(path, note, date);

    console.log(`Updated ${updatedFiles.length} changelog file(s):`);
    updatedFiles.forEach((file) => console.log(`  ${file}`));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
