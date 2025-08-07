/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { ReleaseBumper, ReleaseChanges } from "../index.js";
import { setupMockPackages } from "./fixtures/packages.js";

describe("ReleaseBumper", () => {
  let mockExecSync;
  let mockFsModule;
  let releaseBumper;
  let capturedCommands;
  let fileContents;

  beforeEach(() => {
    capturedCommands = [];
    fileContents = new Map();

    mockExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      return "";
    };

    mockFsModule = {
      readFileSync: (path, _encoding) => {
        return fileContents.get(path) || "{}";
      },
      writeFileSync: (path, content) => {
        fileContents.set(path, content);
      },
      readdirSync: (dir, options) => {
        // Mock implementation that returns empty array by default
        if (options?.withFileTypes) {
          return [];
        }
        return [];
      },
    };

    releaseBumper = new ReleaseBumper(
      mockExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );
  });

  test("creates release bumper with dependencies", () => {
    assert.strictEqual(typeof releaseBumper.bump, "function");
  });

  test("bumps single package without dependents", async () => {
    setupMockPackages(fileContents, {
      "packages/libconfig/package.json": "libconfig",
    });

    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, "libconfig");

    // Should have called npm version on the package
    const npmVersionCalls = capturedCommands.filter((cmd) =>
      cmd.command.includes("npm version patch"),
    );
    assert.strictEqual(npmVersionCalls.length, 1);
  });

  test("bumps package and updates dependents", async () => {
    setupMockPackages(fileContents, {
      "packages/libconfig/package.json": "libconfig",
      "packages/libservice/package.json": "libservice",
    });

    // Mock npm version to simulate version bump to 0.1.1
    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const packagePath = options.cwd + "/package.json";
        const pkg = JSON.parse(fileContents.get(packagePath));
        pkg.version = "0.1.1";
        fileContents.set(packagePath, JSON.stringify(pkg, null, 2));
      }
      // Mock git status to show changes for package files
      if (command.includes("git status --porcelain")) {
        return "M package.json\n"; // Simulate changes to package files
      }
      return "";
    };

    // Mock readdirSync to return the packages directory structure
    mockFsModule.readdirSync = (dir, options) => {
      if (dir === "packages" && options?.withFileTypes) {
        return [
          { name: "libconfig", isDirectory: () => true },
          { name: "libservice", isDirectory: () => true },
        ];
      }
      return [];
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    // Should bump both libconfig and libservice
    assert.strictEqual(results.length, 2);

    // Check that libservice dependency was updated
    const libservicePkg = JSON.parse(
      fileContents.get("packages/libservice/package.json"),
    );
    assert.strictEqual(
      libservicePkg.dependencies["@copilot-ld/libconfig"],
      "^0.1.1",
    );
  });

  test("handles recursive dependencies correctly", async () => {
    setupMockPackages(fileContents, {
      "packages/libconfig/package.json": "libconfig",
      "packages/libservice/package.json": "libservice",
      "services/agent/package.json": "agent",
    });

    // Mock npm version behavior
    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const packagePath = options.cwd + "/package.json";
        const pkg = JSON.parse(fileContents.get(packagePath));
        const [major, minor, patch] = pkg.version.split(".").map(Number);
        pkg.version = `${major}.${minor}.${patch + 1}`;
        fileContents.set(packagePath, JSON.stringify(pkg, null, 2));
      }
      // Mock git status to show changes for package files
      if (command.includes("git status --porcelain")) {
        return "M package.json\n"; // Simulate changes to package files
      }
      return "";
    };

    // Mock readdirSync to return the directory structure
    mockFsModule.readdirSync = (dir, options) => {
      if (options?.withFileTypes) {
        if (dir === "packages") {
          return [
            { name: "libconfig", isDirectory: () => true },
            { name: "libservice", isDirectory: () => true },
          ];
        }
        if (dir === "services") {
          return [{ name: "agent", isDirectory: () => true }];
        }
      }
      return [];
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    // Should bump libconfig (0.1.0 -> 0.1.1), libservice (0.1.0 -> 0.1.1), and agent (0.1.0 -> 0.1.1)
    assert.strictEqual(results.length, 3);

    // Verify dependency updates
    const libservicePkg = JSON.parse(
      fileContents.get("packages/libservice/package.json"),
    );
    const agentPkg = JSON.parse(
      fileContents.get("services/agent/package.json"),
    );

    assert.strictEqual(
      libservicePkg.dependencies["@copilot-ld/libconfig"],
      "^0.1.1",
    );
    assert.strictEqual(
      agentPkg.dependencies["@copilot-ld/libservice"],
      "^0.1.1",
    );
  });

  test("runs npm install and commits package-lock.json after bumps", async () => {
    setupMockPackages(fileContents, {
      "packages/libconfig/package.json": "libconfig",
    });

    // Mock npm version behavior
    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const packagePath = options.cwd + "/package.json";
        const pkg = JSON.parse(fileContents.get(packagePath));
        pkg.version = "0.1.1";
        fileContents.set(packagePath, JSON.stringify(pkg, null, 2));
      }
      // Mock git status to show changes for package files
      if (command.includes("git status --porcelain")) {
        return "M package-lock.json\n"; // Simulate changes to package-lock.json
      }
      return "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    await releaseBumper.bump("patch", ["packages/libconfig"]);

    // Check that npm install was called
    const npmInstallCalls = capturedCommands.filter(
      (cmd) => cmd.command === "npm install",
    );
    assert.strictEqual(npmInstallCalls.length, 1);

    // Check that package-lock.json was added and committed
    const gitAddLockCalls = capturedCommands.filter(
      (cmd) => cmd.command === "git add package-lock.json",
    );
    assert.strictEqual(gitAddLockCalls.length, 1);

    const gitCommitLockCalls = capturedCommands.filter((cmd) =>
      cmd.command.includes("update package-lock.json after dependency bumps"),
    );
    assert.strictEqual(gitCommitLockCalls.length, 1);
  });

  test("does not commit when there are no changes", async () => {
    setupMockPackages(fileContents, {
      "packages/libconfig/package.json": "libconfig",
    });

    // Mock npm version behavior but git status shows no changes
    const testExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      if (command.includes("npm version patch")) {
        const packagePath = options.cwd + "/package.json";
        const pkg = JSON.parse(fileContents.get(packagePath));
        pkg.version = "0.1.1";
        fileContents.set(packagePath, JSON.stringify(pkg, null, 2));
      }
      // Mock git status to show NO changes
      if (command.includes("git status --porcelain")) {
        return ""; // No changes
      }
      return "";
    };

    releaseBumper = new ReleaseBumper(
      testExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    const results = await releaseBumper.bump("patch", ["packages/libconfig"]);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, "libconfig");

    // Should have called npm version but not git add/commit
    const npmVersionCalls = capturedCommands.filter((cmd) =>
      cmd.command.includes("npm version patch"),
    );
    assert.strictEqual(npmVersionCalls.length, 1);

    // Should NOT have called git add or git commit for package.json
    const gitAddCalls = capturedCommands.filter(
      (cmd) =>
        cmd.command.includes("git add") && cmd.command.includes("package.json"),
    );
    assert.strictEqual(gitAddCalls.length, 0);

    const gitCommitCalls = capturedCommands.filter((cmd) =>
      cmd.command.includes("git commit"),
    );
    assert.strictEqual(gitCommitCalls.length, 0);

    // Should have called npm install but not git commands for package-lock.json
    const npmInstallCalls = capturedCommands.filter(
      (cmd) => cmd.command === "npm install",
    );
    assert.strictEqual(npmInstallCalls.length, 1);

    const gitAddLockCalls = capturedCommands.filter(
      (cmd) => cmd.command === "git add package-lock.json",
    );
    assert.strictEqual(gitAddLockCalls.length, 0);
  });

  test("does not update package-lock.json when no packages bumped", async () => {
    // Empty items array - no packages to bump
    const results = await releaseBumper.bump("patch", []);

    assert.strictEqual(results.length, 0);

    // Should not have called npm install or git commands for package-lock.json
    const npmInstallCalls = capturedCommands.filter(
      (cmd) => cmd.command === "npm install",
    );
    assert.strictEqual(npmInstallCalls.length, 0);

    const gitAddLockCalls = capturedCommands.filter(
      (cmd) => cmd.command === "git add package-lock.json",
    );
    assert.strictEqual(gitAddLockCalls.length, 0);
  });
});

describe("ReleaseChanges", () => {
  let mockExecSync;
  let mockFsModule;
  let releaseChanges;

  beforeEach(() => {
    mockExecSync = (command, _options) => {
      // Mock git diff output
      if (command.includes("git diff --name-only")) {
        return "packages/libconfig/index.js\npackages/libservice/test.js\nservices/agent/service.js\nREADME.md";
      }
      return "";
    };

    mockFsModule = {
      existsSync: (path) => {
        // Mock package.json existence
        return (
          path.endsWith("package.json") &&
          (path.includes("libconfig") ||
            path.includes("libservice") ||
            path.includes("agent"))
        );
      },
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFsModule.existsSync);
  });

  test("creates release changes with dependencies", () => {
    assert.strictEqual(typeof releaseChanges.getChangedPackages, "function");
  });

  test("finds changed packages between commits", () => {
    const changes = releaseChanges.getChangedPackages("abc123", "def456");

    assert.deepStrictEqual(changes, [
      "packages/libconfig",
      "packages/libservice",
      "services/agent",
    ]);
  });

  test("filters out packages without package.json", () => {
    mockFsModule.existsSync = (path) => {
      // Only libconfig has package.json
      return path === "packages/libconfig/package.json";
    };

    releaseChanges = new ReleaseChanges(mockExecSync, mockFsModule.existsSync);
    const changes = releaseChanges.getChangedPackages("abc123", "def456");

    assert.deepStrictEqual(changes, ["packages/libconfig"]);
  });

  test("handles empty diff output", () => {
    const emptyExecSync = () => "";
    releaseChanges = new ReleaseChanges(emptyExecSync, mockFsModule.existsSync);

    const changes = releaseChanges.getChangedPackages("abc123", "def456");
    assert.deepStrictEqual(changes, []);
  });
});
