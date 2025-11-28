/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ReleaseBumper } from "../bumper.js";

import { packageJsonFixtures } from "./fixtures/file-samples.js";
import { directoryStructures } from "./fixtures/git-mocks.js";

describe("ReleaseBumper", () => {
  let mockExecSync;
  let mockFs;
  let releaseBumper;
  let capturedCommands;
  let fileContents;
  const testWorkingDir = "/test/project";

  beforeEach(() => {
    capturedCommands = [];
    fileContents = new Map();

    mockExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("git status --porcelain")) {
        return "M package.json\n";
      }
      return "";
    };

    mockFs = {
      readFileSync: (path) => fileContents.get(path) || "{}",
      writeFileSync: (path, content) => fileContents.set(path, content),
      readdirSync: (dir, _options) => directoryStructures.minimal[dir] || [],
    };

    releaseBumper = new ReleaseBumper(
      mockExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );
  });

  /**
   * Helper function to set up mock package.json files for testing
   * @param {object} packages - Object mapping file paths to package names
   */
  function setupPackageFiles(packages) {
    for (const [path, name] of Object.entries(packages)) {
      const content = JSON.stringify(packageJsonFixtures[name]);
      // Store both relative and absolute paths
      fileContents.set(path, content);
      fileContents.set(`${testWorkingDir}/${path}`, content);
    }
  }

  test("constructor requires all dependencies", () => {
    assert.throws(() => new ReleaseBumper(), {
      message: "execSyncFn is required",
    });
    assert.throws(() => new ReleaseBumper(mockExecSync), {
      message: "readFileSyncFn is required",
    });
    assert.throws(() => new ReleaseBumper(mockExecSync, mockFs.readFileSync), {
      message: "writeFileSyncFn is required",
    });
    assert.throws(
      () =>
        new ReleaseBumper(
          mockExecSync,
          mockFs.readFileSync,
          mockFs.writeFileSync,
        ),
      { message: "readdirSyncFn is required" },
    );
  });

  test("bumps single package without dependents", async () => {
    setupPackageFiles({ "packages/libconfig/package.json": "libconfig" });

    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const pkg = JSON.parse(fileContents.get(options.cwd + "/package.json"));
        pkg.version = "0.1.1";
        fileContents.set(options.cwd + "/package.json", JSON.stringify(pkg));
      }
      return command.includes("git status") ? "M package.json\n" : "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );
    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, "libconfig");
    assert.strictEqual(results[0].version, "0.1.1");
  });

  test("handles cascade dependency updates", async () => {
    setupPackageFiles({
      "packages/libconfig/package.json": "libconfig",
      "packages/librpc/package.json": "librpc",
      "services/agent/package.json": "agent",
    });

    mockFs.readdirSync = (dir, _options) => {
      // Normalize absolute paths to relative for mock lookup
      const normalizedDir = dir.startsWith(testWorkingDir)
        ? dir.slice(testWorkingDir.length + 1)
        : dir;
      return directoryStructures.complex[normalizedDir] || [];
    };

    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const pkg = JSON.parse(fileContents.get(options.cwd + "/package.json"));
        const [major, minor, patch] = pkg.version.split(".").map(Number);
        pkg.version = `${major}.${minor}.${patch + 1}`;
        fileContents.set(options.cwd + "/package.json", JSON.stringify(pkg));
      }
      return command.includes("git status") ? "M package.json\n" : "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );
    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 3);
    assert(results.some((r) => r.name === "libconfig"));
    assert(results.some((r) => r.name === "librpc"));
    assert(results.some((r) => r.name === "agent"));
  });

  test("updates package-lock.json after bumps", async () => {
    setupPackageFiles({ "packages/libconfig/package.json": "libconfig" });

    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version")) {
        const pkg = JSON.parse(fileContents.get(options.cwd + "/package.json"));
        pkg.version = "0.1.1";
        fileContents.set(options.cwd + "/package.json", JSON.stringify(pkg));
      }
      if (
        command.includes("git status") &&
        command.includes("package-lock.json")
      ) {
        return "M package-lock.json\n";
      }
      return command.includes("git status") ? "M package.json\n" : "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );
    await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert(
      capturedCommands.some(
        (c) => c.command === "npm install --ignore-scripts",
      ),
    );
    assert(
      capturedCommands.some((c) => c.command === "git add package-lock.json"),
    );
    assert(
      capturedCommands.some((c) =>
        c.command.includes("update package-lock.json"),
      ),
    );
  });

  test("skips commits when no changes detected", async () => {
    setupPackageFiles({ "packages/libconfig/package.json": "libconfig" });

    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version")) {
        const pkg = JSON.parse(fileContents.get(options.cwd + "/package.json"));
        pkg.version = "0.1.1";
        fileContents.set(options.cwd + "/package.json", JSON.stringify(pkg));
      }
      return command.includes("git status") ? "" : "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );
    await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert(!capturedCommands.some((c) => c.command.includes("git add")));
    assert(!capturedCommands.some((c) => c.command.includes("git commit")));
  });

  test("handles empty packages array", async () => {
    const results = await releaseBumper.bump("patch", []);
    assert.strictEqual(results.length, 0);
    assert(
      !capturedCommands.some(
        (c) => c.command === "npm install --ignore-scripts",
      ),
    );
  });

  test("handles command failures with proper error context", async () => {
    setupPackageFiles({ "packages/libconfig/package.json": "libconfig" });

    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version")) {
        const error = new Error("Command failed: npm version");
        error.stderr = Buffer.from(
          "npm version failed: package.json not found",
        );
        throw error;
      }
      return "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.readdirSync,
      testWorkingDir,
    );

    await assert.rejects(
      () => releaseBumper.bump("patch", ["packages/libconfig"]),
      {
        message: /Command failed/,
      },
    );
  });
});
