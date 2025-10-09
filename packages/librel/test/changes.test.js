/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ReleaseChanges } from "../changes.js";

import { gitDiffOutputs } from "./fixtures/git-mocks.js";

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
          path.includes("librpc") ||
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
      "packages/librpc",
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
