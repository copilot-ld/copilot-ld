#!/usr/bin/env node
import { execSync } from "child_process";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { ZipExtractor } from "@copilot-ld/libutil";

/**
 * Downloads demo-data artifact from the last successful workflow run
 * Extracts the artifact contents to the data directory
 */
async function main() {
  try {
    const config = await createScriptConfig("demo-data");

    // Get the last successful run of the demo-data workflow
    const runsJson = execSync(
      "gh api -X GET /repos/copilot-ld/copilot-ld/actions/workflows/demo-data.yml/runs -f status=success -f per_page=1",
      { encoding: "utf8" },
    );
    const runs = JSON.parse(runsJson);

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      throw new Error("No successful demo-data workflow runs found");
    }

    const runId = runs.workflow_runs[0].id;

    if (process.argv.includes("--last")) {
      console.log(runId);
      return;
    }

    // List artifacts for the run
    const artifactsJson = execSync(
      `gh api -X GET /repos/copilot-ld/copilot-ld/actions/runs/${runId}/artifacts`,
      { encoding: "utf8" },
    );
    const artifacts = JSON.parse(artifactsJson);

    const demoDataArtifact = artifacts.artifacts.find(
      (a) => a.name === "demo-data",
    );

    if (!demoDataArtifact) {
      throw new Error("demo-data artifact not found");
    }

    // Download the artifact
    const downloadUrl = demoDataArtifact.archive_download_url;
    const ghToken = config.ghToken();
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Extract the zip to temp location
    const tempFile = "./demo-data.zip";
    const fileStream = createWriteStream(tempFile);
    await pipeline(response.body, fileStream);

    // Extract the artifact using native ZipExtractor
    const zipExtractor = new ZipExtractor(fs, path);
    await zipExtractor.extract(tempFile, ".");

    // Clean up temp file
    await fs.unlink(tempFile);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
