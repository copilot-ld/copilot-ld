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
  #workingDir;

  /**
   *
   * @param execSyncFn
   * @param readFileSyncFn
   * @param writeFileSyncFn
   * @param readdirSyncFn
   * @param workingDir
   */
  constructor(
    execSyncFn,
    readFileSyncFn,
    writeFileSyncFn,
    readdirSyncFn,
    workingDir = process.cwd(),
  ) {
    if (!execSyncFn) throw new Error("execSyncFn is required");
    if (!readFileSyncFn) throw new Error("readFileSyncFn is required");
    if (!writeFileSyncFn) throw new Error("writeFileSyncFn is required");
    if (!readdirSyncFn) throw new Error("readdirSyncFn is required");
    this.#execSync = execSyncFn;
    this.#readFileSync = readFileSyncFn;
    this.#writeFileSync = writeFileSyncFn;
    this.#readdirSync = readdirSyncFn;
    this.#workingDir = workingDir;
  }

  /**
   * Bumps version for items
   * @param {string} bumpType - Type of version bump (major, minor, patch)
   * @param {string[]} items - Items to bump
   * @param {object} options - Bump options
   * @returns {Promise<object[]>} Bump results
   */
  async bump(bumpType, items, options = {}) {
    const results = [];
    const processed = new Set();
    for (const item of items) {
      await this.#bumpRecursively(bumpType, item, results, processed, options);
    }

    if (results.length > 0) {
      this.#execSync("npm install", { cwd: this.#workingDir });

      if (this.#hasChanges("package-lock.json")) {
        this.#execSync("git add package-lock.json", { cwd: this.#workingDir });
        this.#execSync(
          'git commit --no-verify -m "chore: update package-lock.json after dependency bumps"',
          { cwd: this.#workingDir },
        );
      }
    }

    return results;
  }

  /**
   *
   * @param bumpType
   * @param item
   * @param results
   * @param processed
   * @param options
   */
  async #bumpRecursively(bumpType, item, results, processed, options) {
    if (processed.has(item)) return;
    processed.add(item);

    const [type, name] = item.split("/");
    const packagePath = join(item, "package.json");
    const itemAbsolutePath = join(this.#workingDir, item);

    this.#execSync(`npm version ${bumpType} --no-git-tag-version`, {
      cwd: itemAbsolutePath,
    });

    const pkg = JSON.parse(
      this.#readFileSync(join(this.#workingDir, packagePath), "utf8"),
    );
    const newVersion = pkg.version;
    const packageName = pkg.name;

    if (this.#hasChanges(packagePath)) {
      this.#execSync(`git add ${packagePath}`, { cwd: this.#workingDir });
      this.#execSync(
        `git commit --no-verify -m "chore: bump ${name} to v${newVersion}"`,
        { cwd: this.#workingDir },
      );

      try {
        this.#execSync(`git tag ${name}@v${newVersion}`, {
          cwd: this.#workingDir,
        });
      } catch (error) {
        if (options.force === true) {
          this.#execSync(`git tag -f ${name}@v${newVersion}`, {
            cwd: this.#workingDir,
          });
        } else {
          throw error;
        }
      }
    }

    results.push({ type, name, version: newVersion });

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

  /**
   *
   * @param packageName
   */
  #findDependents(packageName) {
    const dependents = [];
    for (const dir of ["packages", "services", "extensions", "tools"]) {
      let subdirs;
      try {
        const absoluteDir = join(this.#workingDir, dir);
        subdirs = this.#readdirSync(absoluteDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => join(dir, dirent.name));
      } catch {
        continue;
      }

      for (const subdir of subdirs) {
        try {
          const pkg = JSON.parse(
            this.#readFileSync(
              join(this.#workingDir, subdir, "package.json"),
              "utf8",
            ),
          );
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps[packageName]) dependents.push(subdir);
        } catch {
          continue;
        }
      }
    }
    return dependents;
  }

  /**
   *
   * @param packagePath
   * @param dependencyName
   * @param newVersion
   */
  #updateDependency(packagePath, dependencyName, newVersion) {
    const packageJsonPath = join(packagePath, "package.json");
    const absolutePackageJsonPath = join(this.#workingDir, packageJsonPath);
    const pkg = JSON.parse(this.#readFileSync(absolutePackageJsonPath, "utf8"));

    if (pkg.dependencies?.[dependencyName])
      pkg.dependencies[dependencyName] = `^${newVersion}`;
    if (pkg.devDependencies?.[dependencyName])
      pkg.devDependencies[dependencyName] = `^${newVersion}`;

    this.#writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(pkg, null, 2) + "\n",
    );
    this.#execSync(`git add ${packageJsonPath}`, { cwd: this.#workingDir });
  }

  /**
   * Checks if a file has changes that can be committed
   * @param {string} filePath - Path to the file to check
   * @returns {boolean} True if file has changes, false otherwise
   */
  #hasChanges(filePath) {
    try {
      const result = this.#execSync(`git status --porcelain ${filePath}`, {
        cwd: this.#workingDir,
        encoding: "utf8",
      });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }
}
