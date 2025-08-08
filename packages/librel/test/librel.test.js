/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ReleaseBumper, ReleaseChanges, ReleaseLog } from "../index.js";

import {
  changelogFixtures,
  packageJsonFixtures,
} from "./fixtures/file-samples.js";
import {
  gitDiffOutputs,
  directoryStructures,
  globPatterns,
} from "./fixtures/git-mocks.js";

describe("ReleaseBumper", () => {
  let mockExecSync;
  let mockFs;
  let releaseBumper;
  let capturedCommands;
  let fileContents;

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
    );
  });

  /**
   * Helper function to set up mock package.json files for testing
   * @param {object} packages - Object mapping file paths to package names
   */
  function setupPackageFiles(packages) {
    for (const [path, name] of Object.entries(packages)) {
      fileContents.set(path, JSON.stringify(packageJsonFixtures[name]));
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
    );
    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, "libconfig");
    assert.strictEqual(results[0].version, "0.1.1");
  });

  test("handles cascade dependency updates", async () => {
    setupPackageFiles({
      "packages/libconfig/package.json": "libconfig",
      "packages/libservice/package.json": "libservice",
      "services/agent/package.json": "agent",
    });

    mockFs.readdirSync = (dir, _options) =>
      directoryStructures.complex[dir] || [];

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
    );
    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 3);
    assert(results.some((r) => r.name === "libconfig"));
    assert(results.some((r) => r.name === "libservice"));
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
    );
    await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert(capturedCommands.some((c) => c.command === "npm install"));
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
    );
    await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert(!capturedCommands.some((c) => c.command.includes("git add")));
    assert(!capturedCommands.some((c) => c.command.includes("git commit")));
  });

  test("handles empty packages array", async () => {
    const results = await releaseBumper.bump("patch", []);
    assert.strictEqual(results.length, 0);
    assert(!capturedCommands.some((c) => c.command === "npm install"));
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
    );

    await assert.rejects(
      () => releaseBumper.bump("patch", ["packages/libconfig"]),
      {
        message: /Command failed/,
      },
    );
  });
});

describe("ReleaseChanges", () => {
  let mockExecSync;
  let mockFs;
  let releaseChanges;

  beforeEach(() => {
    mockExecSync = (command) => {
      if (command.includes("git diff --name-only")) {
        return gitDiffOutputs.multiplePackages;
      }
      return "";
    };

    mockFs = {
      existsSync: (path) =>
        path.endsWith("package.json") &&
        (path.includes("libconfig") ||
          path.includes("libservice") ||
          path.includes("agent")),
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);
  });

  test("constructor requires dependencies", () => {
    assert.throws(() => new ReleaseChanges(), {
      message: "execSyncFn is required",
    });
    assert.throws(() => new ReleaseChanges(mockExecSync), {
      message: "existsSyncFn is required",
    });
  });

  test("finds changed packages between commits", () => {
    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, [
      "packages/libconfig",
      "packages/libservice",
      "services/agent",
    ]);
  });

  test("filters packages without package.json", () => {
    mockFs.existsSync = (path) => path === "packages/libconfig/package.json";
    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);

    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, ["packages/libconfig"]);
  });

  test("handles empty diff output", () => {
    mockExecSync = () => gitDiffOutputs.empty;
    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);

    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, []);
  });

  test("validates commit SHAs exist", () => {
    mockExecSync = (command) => {
      if (command.includes("git cat-file -e invalid-sha")) {
        throw new Error("Command failed: git cat-file -e invalid-sha");
      }
      return "";
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);

    assert.throws(
      () => releaseChanges.getChangedPackages("invalid-sha", "def456"),
      {
        message: /Base commit SHA 'invalid-sha' does not exist/,
      },
    );
  });

  test("requires both SHA parameters", () => {
    assert.throws(() => releaseChanges.getChangedPackages(), {
      message: "Both baseSha and headSha are required",
    });
    assert.throws(() => releaseChanges.getChangedPackages("abc123"), {
      message: "Both baseSha and headSha are required",
    });
  });

  test("handles git diff command failures", () => {
    mockExecSync = (command) => {
      if (command.includes("git diff --name-only")) {
        const error = new Error("Command failed");
        error.stderr = "fatal: bad revision";
        throw error;
      }
      return "";
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);

    assert.throws(() => releaseChanges.getChangedPackages("abc123", "def456"), {
      message: /Git diff command failed/,
    });
  });

  test("handles head SHA validation failure", () => {
    mockExecSync = (command) => {
      if (command.includes("git cat-file -e def456")) {
        throw new Error("Command failed: git cat-file -e def456");
      }
      return "";
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFs.existsSync);

    assert.throws(() => releaseChanges.getChangedPackages("abc123", "def456"), {
      message: /Head commit SHA 'def456' does not exist/,
    });
  });
});

describe("ReleaseLog", () => {
  let mockGlobSync;
  let mockFs;
  let releaseLog;
  let fileContents;

  beforeEach(() => {
    fileContents = new Map();

    mockGlobSync = (pattern) =>
      globPatterns.recursive[pattern] || globPatterns.direct[pattern] || [];

    mockFs = {
      readFileSync: (path) => fileContents.get(path) || "",
      writeFileSync: (path, content) => fileContents.set(path, content),
      existsSync: (path) => fileContents.has(path),
    };

    releaseLog = new ReleaseLog(
      mockGlobSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.existsSync,
    );
  });

  test("constructor requires all dependencies", () => {
    assert.throws(() => new ReleaseLog(), {
      message: "globSyncFn is required",
    });
    assert.throws(() => new ReleaseLog(mockGlobSync), {
      message: "readFileSyncFn is required",
    });
    assert.throws(() => new ReleaseLog(mockGlobSync, mockFs.readFileSync), {
      message: "writeFileSyncFn is required",
    });
    assert.throws(
      () =>
        new ReleaseLog(mockGlobSync, mockFs.readFileSync, mockFs.writeFileSync),
      { message: "existsSyncFn is required" },
    );
  });

  test("addNote requires path and note parameters", async () => {
    await assert.rejects(() => releaseLog.addNote(), {
      message: "path is required",
    });
    await assert.rejects(() => releaseLog.addNote("packages/"), {
      message: "note is required",
    });
  });

  test("creates new changelog with proper format", async () => {
    const paths = await releaseLog.addNote(
      "packages/",
      "Initial release",
      "2025-08-08",
    );

    assert.deepStrictEqual(paths, [
      "packages/libconfig/CHANGELOG.md",
      "packages/libservice/CHANGELOG.md",
    ]);

    const expectedContent = `# Changelog

## 2025-08-08

- Initial release
`;

    assert.strictEqual(
      fileContents.get("packages/libconfig/CHANGELOG.md"),
      expectedContent,
    );
  });

  test("adds note to existing date heading", async () => {
    fileContents.set(
      "packages/libconfig/CHANGELOG.md",
      changelogFixtures.withExistingDate,
    );

    await releaseLog.addNote("packages/", "Second change", "2025-08-08");

    const content = fileContents.get("packages/libconfig/CHANGELOG.md");
    assert(content.includes("- Existing change for today"));
    assert(content.includes("- Second change"));
  });

  test("maintains chronological order when adding new dates", async () => {
    fileContents.set(
      "packages/libconfig/CHANGELOG.md",
      changelogFixtures.chronologicalOrder,
    );

    await releaseLog.addNote("packages/", "Middle insertion", "2025-08-03");

    const content = fileContents.get("packages/libconfig/CHANGELOG.md");
    const lines = content.split("\n");
    const dateIndices = lines
      .map((line, idx) => (line.startsWith("## ") ? idx : -1))
      .filter((idx) => idx !== -1);

    assert.strictEqual(lines[dateIndices[0]], "## 2025-08-01");
    assert.strictEqual(lines[dateIndices[1]], "## 2025-08-03");
    assert.strictEqual(lines[dateIndices[2]], "## 2025-08-05");
    assert.strictEqual(lines[dateIndices[3]], "## 2025-08-10");
  });

  test("uses today's date when not provided", async () => {
    const today = new Date().toISOString().split("T")[0];

    await releaseLog.addNote("packages/", "Feature added");

    const content = fileContents.get("packages/libconfig/CHANGELOG.md");
    assert(content.includes(`## ${today}`));
    assert(content.includes("- Feature added"));
  });

  test("adds header to files without changelog header", async () => {
    fileContents.set(
      "packages/libconfig/CHANGELOG.md",
      changelogFixtures.noHeader,
    );

    await releaseLog.addNote("packages/", "New change", "2025-08-02");

    const content = fileContents.get("packages/libconfig/CHANGELOG.md");
    assert(content.startsWith("# Changelog"));
  });

  test("handles direct changelog file paths", async () => {
    mockGlobSync = (pattern) => {
      if (pattern === "packages/libconfig/CHANGELOG.md") {
        return ["packages/libconfig/CHANGELOG.md"];
      }
      return [];
    };

    releaseLog = new ReleaseLog(
      mockGlobSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.existsSync,
    );

    const paths = await releaseLog.addNote(
      "packages/libconfig/CHANGELOG.md",
      "Direct update",
      "2025-08-08",
    );

    assert.deepStrictEqual(paths, ["packages/libconfig/CHANGELOG.md"]);
    assert(
      fileContents
        .get("packages/libconfig/CHANGELOG.md")
        .includes("- Direct update"),
    );
  });

  test("handles glob pattern failures gracefully", async () => {
    mockGlobSync = () => {
      throw new Error("Glob failed");
    };
    mockFs.existsSync = (path) => path === "packages/CHANGELOG.md";

    releaseLog = new ReleaseLog(
      mockGlobSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.existsSync,
    );

    const paths = await releaseLog.addNote(
      "packages/CHANGELOG.md",
      "Fallback test",
      "2025-08-08",
    );

    assert.deepStrictEqual(paths, ["packages/CHANGELOG.md"]);
  });

  test("handles multiple changelog updates with different dates", async () => {
    fileContents.set(
      "packages/libconfig/CHANGELOG.md",
      changelogFixtures.multipleEntries,
    );

    await releaseLog.addNote(
      "packages/",
      "New entry for Aug 1st",
      "2025-08-01",
    );
    await releaseLog.addNote(
      "packages/",
      "New entry for Aug 3rd",
      "2025-08-03",
    );

    const content = fileContents.get("packages/libconfig/CHANGELOG.md");

    assert(content.includes("- New entry for Aug 1st"));
    assert(content.includes("- New entry for Aug 3rd"));
    assert(content.includes("## 2025-08-03"));
  });

  test("handles file update errors gracefully", async () => {
    fileContents.set(
      "packages/libconfig/CHANGELOG.md",
      changelogFixtures.basic,
    );

    mockFs.writeFileSync = () => {
      throw new Error("Write failed");
    };

    releaseLog = new ReleaseLog(
      mockGlobSync,
      mockFs.readFileSync,
      mockFs.writeFileSync,
      mockFs.existsSync,
    );

    const paths = await releaseLog.addNote(
      "packages/",
      "Test note",
      "2025-08-08",
    );

    assert.deepStrictEqual(paths, []);
  });
});
