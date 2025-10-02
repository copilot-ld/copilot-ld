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

/**
 * Release changes detection implementation with dependency injection
 */
export class ReleaseChanges {
  #execSync;
  #existsSync;

  constructor(execSyncFn, existsSyncFn) {
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

/**
 * Release log management implementation with dependency injection
 */
export class ReleaseLog {
  #globSync;
  #readFileSync;
  #writeFileSync;
  #existsSync;

  constructor(globSyncFn, readFileSyncFn, writeFileSyncFn, existsSyncFn) {
    if (!globSyncFn) throw new Error("globSyncFn is required");
    if (!readFileSyncFn) throw new Error("readFileSyncFn is required");
    if (!writeFileSyncFn) throw new Error("writeFileSyncFn is required");
    if (!existsSyncFn) throw new Error("existsSyncFn is required");
    this.#globSync = globSyncFn;
    this.#readFileSync = readFileSyncFn;
    this.#writeFileSync = writeFileSyncFn;
    this.#existsSync = existsSyncFn;
  }

  /**
   * Adds a note to changelog
   * @param {string} path - Path to changelog
   * @param {string} note - Note to add
   * @param {string} date - Date for the note
   * @returns {Promise<string[]>} Updated changelog paths
   */
  async addNote(path, note, date) {
    if (!path) throw new Error("path is required");
    if (!note) throw new Error("note is required");

    // Use today's date if not provided
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Find all CHANGELOG.md files under the path
    const changelogFiles = this.#findChangelogFiles(path);

    const updatedFiles = [];
    for (const filePath of changelogFiles) {
      try {
        this.#updateChangelog(filePath, note, targetDate);
        updatedFiles.push(filePath);
      } catch (error) {
        // Log error but continue processing other files
        console.error(`Failed to update ${filePath}: ${error.message}`);
      }
    }

    return updatedFiles;
  }

  #findChangelogFiles(path) {
    const patterns = [];

    // If path ends with CHANGELOG.md, use it directly
    if (path.endsWith("CHANGELOG.md")) {
      patterns.push(path);
    } else {
      // Otherwise, search recursively for CHANGELOG.md files
      const searchPath = path.endsWith("/") ? path : `${path}/`;
      patterns.push(`${searchPath}**/CHANGELOG.md`);
    }

    const files = [];
    for (const pattern of patterns) {
      try {
        const matches = this.#globSync(pattern);
        files.push(...matches);
      } catch (error) {
        // If glob fails, try direct file check
        console.error(`Glob pattern failed for ${pattern}: ${error.message}`);
        if (this.#existsSync(pattern)) {
          files.push(pattern);
        }
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  #updateChangelog(filePath, note, targetDate) {
    let content = "";

    // Read existing content or create new file
    if (this.#existsSync(filePath)) {
      content = this.#readFileSync(filePath, "utf8");
    } else {
      content = "# Changelog\n\n";
    }

    // Ensure file starts with proper header
    if (!content.includes("# Changelog")) {
      content = "# Changelog\n\n" + content;
    }

    const lines = content.split("\n");
    const dateHeading = `## ${targetDate}`;
    const noteBullet = `- ${note}`;

    // Find if date heading already exists
    const dateHeadingIndex = lines.findIndex(
      (line) => line.trim() === dateHeading,
    );

    if (dateHeadingIndex !== -1) {
      // Date heading exists, add note after it
      // Find the next line that's not empty after the heading
      let insertIndex = dateHeadingIndex + 1;

      // Skip any empty lines immediately after the heading
      while (insertIndex < lines.length && lines[insertIndex].trim() === "") {
        insertIndex++;
      }

      // Find the position after existing bullets for this date
      while (
        insertIndex < lines.length &&
        lines[insertIndex].startsWith("- ")
      ) {
        insertIndex++;
      }

      lines.splice(insertIndex, 0, noteBullet);
    } else {
      // Date heading doesn't exist, need to add it
      // Find where to insert based on chronological order (ascending)
      let insertIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("## ")) {
          const existingDate = line.substring(3).trim();
          if (targetDate < existingDate) {
            insertIndex = i;
            break;
          }
        }
      }

      if (insertIndex === -1) {
        // Add at the end
        // Find the last content line to append after
        let lastContentIndex = lines.length - 1;
        while (lastContentIndex >= 0 && lines[lastContentIndex].trim() === "") {
          lastContentIndex--;
        }
        insertIndex = lastContentIndex + 1;

        // For new files, ensure proper spacing after the header
        if (insertIndex <= 2) {
          // Right after "# Changelog" and empty line
          insertIndex = 2;
        }
      }

      // Ensure proper spacing before new section
      if (
        insertIndex > 0 &&
        lines[insertIndex - 1].trim() !== "" &&
        !lines[insertIndex - 1].startsWith("# ")
      ) {
        lines.splice(insertIndex, 0, "");
        insertIndex++;
      }

      // Insert date heading, empty line, and note
      lines.splice(insertIndex, 0, dateHeading, "", noteBullet);

      // Ensure spacing after new section if there's content following
      if (
        insertIndex + 3 < lines.length &&
        lines[insertIndex + 3].trim() !== ""
      ) {
        lines.splice(insertIndex + 3, 0, "");
      }
    }

    // Clean up content and ensure exactly one trailing newline
    let updatedContent = lines.join("\n");

    // Remove multiple trailing newlines and add exactly one
    updatedContent = updatedContent.replace(/\n+$/, "") + "\n";

    this.#writeFileSync(filePath, updatedContent);
  }
}
