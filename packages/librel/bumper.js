/* eslint-env node */
import { join } from "path";

/**
 * Release bumper implementation with dependency injection
 */
export class ReleaseBumper {
  #execSync;
  #readFileSync;
  #writeFileSync;
  #readdirSync;

  constructor(execSyncFn, readFileSyncFn, writeFileSyncFn, readdirSyncFn) {
    if (!execSyncFn) throw new Error("execSyncFn is required");
    if (!readFileSyncFn) throw new Error("readFileSyncFn is required");
    if (!writeFileSyncFn) throw new Error("writeFileSyncFn is required");
    if (!readdirSyncFn) throw new Error("readdirSyncFn is required");
    this.#execSync = execSyncFn;
    this.#readFileSync = readFileSyncFn;
    this.#writeFileSync = writeFileSyncFn;
    this.#readdirSync = readdirSyncFn;
  }

  /**
   * Bumps version for items
   * @param {string} bumpType - Type of version bump (major, minor, patch)
   * @param {string[]} items - Items to bump
   * @param {object} options - Bump options
   * @returns {Promise<object[]>} Bump results
   */
  async bump(bumpType, items, options = {}) {
    // Capture initial working directory (assuming tool starts at repo root)
    const initialCwd = process.cwd();

    const results = [];
    const processed = new Set();
    for (const item of items) {
      await this.#bumpRecursively(bumpType, item, results, processed, options);
    }

    // Update package-lock.json in root after all bumps are complete
    if (results.length > 0) {
      this.#execSync("npm install", { cwd: initialCwd });

      // Only add and commit package-lock.json if there are changes
      if (this.#hasChanges("package-lock.json", initialCwd)) {
        this.#execSync("git add package-lock.json", { cwd: initialCwd });
        this.#execSync(
          'git commit --no-verify -m "chore: update package-lock.json after dependency bumps"',
          { cwd: initialCwd },
        );
      }
    }

    return results;
  }

  async #bumpRecursively(bumpType, item, results, processed, options) {
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
      this.#execSync(
        `git commit --no-verify -m "chore: bump ${name} to v${newVersion}"`,
      );
      // Create or update the tag. If it exists and force is true, overwrite it
      try {
        this.#execSync(`git tag ${name}@v${newVersion}`);
      } catch (error) {
        if (options.force === true) {
          // Overwrite existing tag to point at the new commit
          this.#execSync(`git tag -f ${name}@v${newVersion}`);
        } else {
          throw error;
        }
      }
    }

    // Record the bump result
    results.push({ type, name, version: newVersion });

    // Find all packages that depend on this one and recursively bump them
    const dependents = this.#findDependents(packageName);
    for (const dependent of dependents) {
      this.#updateDependency(dependent, packageName, newVersion);
      await this.#bumpRecursively(
        bumpType,
        dependent,
        results,
        processed,
        options,
      );
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
