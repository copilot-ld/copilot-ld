/* eslint-env node */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { Octokit } from "@octokit/core";

import { ScriptConfig } from "@copilot-ld/libconfig";

const config = await ScriptConfig.create("download");

/**
 * Downloads a file from a GitHub API URL using authentication
 * @param {string} url - The GitHub API URL to download from
 * @param {string} filePath - Local file path where the file should be saved
 * @param {string} token - GitHub authentication token
 * @returns {Promise<void>}
 * @throws {Error} When the download fails
 */
async function downloadFile(url, filePath, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream",
    },
  });

  if (!response.ok) throw new Error(`Error: ${response.status}`);

  fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded: ${path.basename(filePath)}`);
}

/**
 * Downloads the latest release artifacts from a GitHub repository
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {string} token - GitHub authentication token
 * @returns {Promise<void>}
 */
async function downloadLatestArtifact(owner, repo, token) {
  const octokit = new Octokit({ auth: token });
  const outputDir = path.join(process.cwd(), "data");

  fs.mkdirSync(outputDir, { recursive: true });

  const { data: releases } = await octokit.request(
    "GET /repos/{owner}/{repo}/releases",
    {
      owner,
      repo,
    },
  );

  const release = releases.find((r) => r.assets?.length > 0);

  for (const asset of release.assets) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`;
    const filePath = path.join(outputDir, asset.name);
    await downloadFile(url, filePath, token);
    await extractAndCleanup(filePath, outputDir);
  }
}

/**
 * Extracts tar.gz files and removes the archive after extraction
 * @param {string} filePath - Path to the archive file
 * @param {string} outputDir - Directory to extract the archive to
 * @returns {Promise<void>}
 */
async function extractAndCleanup(filePath, outputDir) {
  const fileName = path.basename(filePath);

  if (fileName.endsWith(".tar.gz")) {
    const dirName = fileName.replace(/\.tar\.gz$/, "");
    const extractDir = path.join(outputDir, dirName);
    fs.mkdirSync(extractDir, { recursive: true });

    execSync(`tar -xzf "${filePath}" -C "${extractDir}"`, {
      stdio: "inherit",
    });
    console.log(`Extracted: ${fileName}`);

    fs.unlinkSync(filePath);
    console.log(`Removed: ${fileName}`);
  }
}

downloadLatestArtifact(config.owner, config.repo, await config.githubToken());
