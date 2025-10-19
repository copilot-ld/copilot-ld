/* eslint-env node */
import { resolve } from "path";

/**
 * Release changes detection implementation with dependency injection
 */
export class ReleaseChanges {
  #execSync;
  #existsSync;
  #workingDir;

  constructor(execSyncFn, existsSyncFn, workingDir = process.cwd()) {
    if (!execSyncFn) throw new Error("execSyncFn is required");
    if (!existsSyncFn) throw new Error("existsSyncFn is required");
    this.#execSync = execSyncFn;
    this.#existsSync = existsSyncFn;
    this.#workingDir = workingDir;
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

    try {
      this.#execSync(`git cat-file -e ${baseSha}`, {
        encoding: "utf8",
        cwd: this.#workingDir,
      });
    } catch {
      throw new Error(
        `Base commit SHA '${baseSha}' does not exist in repository`,
      );
    }

    try {
      this.#execSync(`git cat-file -e ${headSha}`, {
        encoding: "utf8",
        cwd: this.#workingDir,
      });
    } catch {
      throw new Error(
        `Head commit SHA '${headSha}' does not exist in repository`,
      );
    }

    let diff;
    try {
      diff = this.#execSync(`git diff --name-only ${baseSha}...${headSha}`, {
        encoding: "utf8",
        cwd: this.#workingDir,
      });
    } catch (error) {
      const command = `git diff --name-only ${baseSha}...${headSha}`;
      const errorMessage = error.stderr
        ? error.stderr.toString()
        : error.message;
      throw new Error(
        `Git diff command failed: ${command}\nError: ${errorMessage}`,
      );
    }

    const items = diff
      .split("\n")
      .filter((path) => /^(packages|services|extensions)\//.test(path))
      .map((path) => path.split("/").slice(0, 2).join("/"))
      .filter((item, index, self) => self.indexOf(item) === index)
      .filter((item) => {
        const packageJsonPath = resolve(this.#workingDir, item, "package.json");
        return this.#existsSync(packageJsonPath);
      });

    return items;
  }
}
