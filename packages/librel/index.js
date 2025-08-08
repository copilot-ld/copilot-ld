/* eslint-env node */
import { join } from "path";

import { ReleaseBumperInterface, ReleaseChangesInterface } from "./types.js";

/**
 * Release bumper implementation with dependency injection
 * @implements {ReleaseBumperInterface}
 */
export class ReleaseBumper extends ReleaseBumperInterface {
  #execSync;
  #readFileSync;
  #writeFileSync;
  #readdirSync;

  constructor(execSyncFn, readFileSyncFn, writeFileSyncFn, readdirSyncFn) {
    super();
    if (!execSyncFn) throw new Error("execSyncFn is required");
    if (!readFileSyncFn) throw new Error("readFileSyncFn is required");
    if (!writeFileSyncFn) throw new Error("writeFileSyncFn is required");
    if (!readdirSyncFn) throw new Error("readdirSyncFn is required");
    this.#execSync = execSyncFn;
    this.#readFileSync = readFileSyncFn;
    this.#writeFileSync = writeFileSyncFn;
    this.#readdirSync = readdirSyncFn;
  }

  /** @inheritdoc */
  async bump(bumpType, items) {
    // Capture initial working directory (assuming tool starts at repo root)
    const initialCwd = process.cwd();

    const results = [];
    const processed = new Set();
    for (const item of items) {
      await this.#bumpRecursively(bumpType, item, results, processed);
    }

    // Update package-lock.json in root after all bumps are complete
    if (results.length > 0) {
      this.#execSync("npm install", { cwd: initialCwd });

      // Only add and commit package-lock.json if there are changes
      if (this.#hasChanges("package-lock.json", initialCwd)) {
        this.#execSync("git add package-lock.json", { cwd: initialCwd });
        this.#execSync(
          'git commit -m "chore: update package-lock.json after dependency bumps"',
          { cwd: initialCwd },
        );
      }
    }

    return results;
  }

  async #bumpRecursively(bumpType, item, results, processed) {
    // Prevent infinite loops in circular dependencies
    if (processed.has(item)) return;
    processed.add(item);

    // Extract directory type and package name from path (e.g., "packages/libconfig")
    const [type, name] = item.split("/");
    const packagePath = join(item, "package.json");

    // Bump the package version using npm (without creating git tag yet)
    this.#execSync(`npm version ${bumpType} --no-git-tag-version`, {
      cwd: item,
    });

    // Read the updated package.json to get the new version and package name
    const pkg = JSON.parse(this.#readFileSync(packagePath, "utf8"));
    const newVersion = pkg.version;
    const packageName = pkg.name;

    // Create git commit and tag for this version bump only if there are changes
    if (this.#hasChanges(packagePath)) {
      this.#execSync(`git add ${packagePath}`);
      this.#execSync(`git commit -m "chore: bump ${name} to v${newVersion}"`);
      this.#execSync(`git tag ${name}@v${newVersion}`);
    }

    // Record the bump result
    results.push({ type, name, version: newVersion });

    // Find all packages that depend on this one and recursively bump them
    const dependents = this.#findDependents(packageName);
    for (const dependent of dependents) {
      this.#updateDependency(dependent, packageName, newVersion);
      await this.#bumpRecursively(bumpType, dependent, results, processed);
    }
  }

  #findDependents(packageName) {
    const dependents = [];
    for (const dir of ["packages", "services", "extensions", "tools"]) {
      try {
        const subdirs = this.#readdirSync(dir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => join(dir, dirent.name));

        for (const subdir of subdirs) {
          try {
            const pkg = JSON.parse(
              this.#readFileSync(join(subdir, "package.json"), "utf8"),
            );
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps[packageName]) dependents.push(subdir);
          } catch {
            /* Ignore packages that can't be read */
          }
        }
      } catch {
        /* Ignore directories that can't be read */
      }
    }
    return dependents;
  }

  #updateDependency(packagePath, dependencyName, newVersion) {
    const packageJsonPath = join(packagePath, "package.json");
    const pkg = JSON.parse(this.#readFileSync(packageJsonPath, "utf8"));

    if (pkg.dependencies?.[dependencyName])
      pkg.dependencies[dependencyName] = `^${newVersion}`;
    if (pkg.devDependencies?.[dependencyName])
      pkg.devDependencies[dependencyName] = `^${newVersion}`;

    this.#writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    this.#execSync(`git add ${packageJsonPath}`);
  }

  /**
   * Checks if a file has changes that can be committed
   * @param {string} filePath - Path to the file to check
   * @param {string} [cwd] - Optional working directory for git command
   * @returns {boolean} True if file has changes, false otherwise
   */
  #hasChanges(filePath, cwd) {
    try {
      const result = this.#execSync(`git status --porcelain ${filePath}`, {
        cwd: cwd || process.cwd(),
        encoding: "utf8",
      });
      return result.trim().length > 0;
    } catch {
      // If git command fails, assume no changes
      return false;
    }
  }
}

/**
 * Release changes detection implementation with dependency injection
 * @implements {ReleaseChangesInterface}
 */
export class ReleaseChanges extends ReleaseChangesInterface {
  #execSync;
  #existsSync;

  constructor(execSyncFn, existsSyncFn) {
    super();
    if (!execSyncFn) throw new Error("execSyncFn is required");
    if (!existsSyncFn) throw new Error("existsSyncFn is required");
    this.#execSync = execSyncFn;
    this.#existsSync = existsSyncFn;
  }

  /**
   * Finds changed packages between two git commits
   * @param {string} baseSha - Base commit SHA for comparison
   * @param {string} headSha - Head commit SHA for comparison
   * @returns {string[]} Array of changed package paths
   */
  getChangedPackages(baseSha, headSha) {
    if (!baseSha || !headSha) {
      throw new Error("Both baseSha and headSha are required");
    }

    // Validate that both SHAs exist in the repository
    try {
      this.#execSync(`git cat-file -e ${baseSha}`, { encoding: "utf8" });
    } catch {
      throw new Error(
        `Base commit SHA '${baseSha}' does not exist in repository`,
      );
    }

    try {
      this.#execSync(`git cat-file -e ${headSha}`, { encoding: "utf8" });
    } catch {
      throw new Error(
        `Head commit SHA '${headSha}' does not exist in repository`,
      );
    }

    // Get changed files between commits
    let diff;
    try {
      diff = this.#execSync(`git diff --name-only ${baseSha}...${headSha}`, {
        encoding: "utf8",
      });
    } catch (error) {
      // Provide better error context including the actual command that failed
      const command = `git diff --name-only ${baseSha}...${headSha}`;
      const errorMessage = error.stderr
        ? error.stderr.toString()
        : error.message;
      throw new Error(
        `Git diff command failed: ${command}\nError: ${errorMessage}`,
      );
    }

    // Filter for packages, services, extensions with package.json
    const items = diff
      .split("\n")
      .filter((path) => /^(packages|services|extensions)\//.test(path))
      .map((path) => path.split("/").slice(0, 2).join("/"))
      .filter((item, index, self) => self.indexOf(item) === index)
      .filter((item) => this.#existsSync(`${item}/package.json`));

    return items;
  }
}

export { ReleaseBumperInterface, ReleaseChangesInterface };
