import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ReleaseChanges } from "../changes.js";

import { gitDiffOutputs } from "./fixtures/git-mocks.js";

describe("ReleaseChanges", () => {
  let mockExecSync;
  let mockFs;
  let releaseChanges;
  const testWorkingDir = "/test/project";

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
          path.includes("librpc") ||
          path.includes("agent")),
    };

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );
  });

  test("constructor requires dependencies", () => {
    assert.throws(() => new ReleaseChanges(), {
      message: "execSyncFn is required",
    });
    assert.throws(() => new ReleaseChanges(mockExecSync), {
      message: "existsSyncFn is required",
    });
  });

  test("constructor accepts optional working directory", () => {
    const changes = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      "/custom/dir",
    );
    assert.ok(changes);
  });

  test("constructor defaults to process.cwd when working directory not provided", () => {
    const changes = new ReleaseChanges(mockExecSync, mockFs.existsSync);
    assert.ok(changes);
  });

  test("finds changed packages between commits", () => {
    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, [
      "packages/libconfig",
      "packages/librpc",
      "services/agent",
    ]);
  });

  test("filters packages without package.json", () => {
    mockFs.existsSync = (path) =>
      path.endsWith("package.json") && path.includes("libconfig");
    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );

    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, ["packages/libconfig"]);
  });

  test("handles empty diff output", () => {
    mockExecSync = () => gitDiffOutputs.empty;
    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );

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

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );

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

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );

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

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );

    assert.throws(() => releaseChanges.getChangedPackages("abc123", "def456"), {
      message: /Head commit SHA 'def456' does not exist/,
    });
  });

  test("uses working directory for git commands", () => {
    let capturedOptions = null;
    mockExecSync = (command, options) => {
      capturedOptions = options;
      if (command.includes("git diff --name-only")) {
        return gitDiffOutputs.empty;
      }
      return "";
    };

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );
    releaseChanges.getChangedPackages("abc123", "def456");

    assert.strictEqual(capturedOptions.cwd, testWorkingDir);
  });

  test("resolves package.json paths relative to working directory", () => {
    const checkedPaths = [];
    mockFs.existsSync = (path) => {
      checkedPaths.push(path);
      return false;
    };

    releaseChanges = new ReleaseChanges(
      mockExecSync,
      mockFs.existsSync,
      testWorkingDir,
    );
    releaseChanges.getChangedPackages("abc123", "def456");

    assert.ok(
      checkedPaths.some((path) => path.startsWith(testWorkingDir)),
      "Paths should be resolved relative to working directory",
    );
  });
});
