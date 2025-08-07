/* eslint-env node */

/**
 * Base interface for release management operations
 */
export class ReleaseBumperInterface {
  /**
   * Creates a new ReleaseBumper instance
   * @param {Function} execSyncDep - execSync dependency for command execution
   * @param {Function} readFileSyncDep - readFileSync dependency for file reading
   * @param {Function} writeFileSyncDep - writeFileSync dependency for file writing
   * @param {Function} readdirSyncDep - readdirSync dependency for directory listing
   */
  constructor(execSyncDep, readFileSyncDep, writeFileSyncDep, readdirSyncDep) {
    // Interface base implementation - do nothing
  }

  /**
   * Bumps version for multiple packages and their dependents recursively
   * Also updates package-lock.json in root directory after all bumps complete
   * @param {string} bumpType - Version bump type (patch, minor, major)
   * @param {string[]} items - Array of package paths to bump
   * @returns {Promise<Array>} Array of bump results with type, name, and version
   * @throws {Error} Not implemented
   */
  async bump(bumpType, items) {
    throw new Error("ReleaseBumperInterface.bump() not implemented");
  }
}

/**
 * Base interface for release change detection operations
 */
export class ReleaseChangesInterface {
  /**
   * Creates a new ReleaseChanges instance
   * @param {Function} execSyncDep - execSync dependency for command execution
   * @param {Function} existsSyncDep - existsSync dependency for file existence checks
   */
  constructor(execSyncDep, existsSyncDep) {
    // Interface base implementation - do nothing
  }

  /**
   * Finds changed packages between two git commits
   * @param {string} baseSha - Base commit SHA for comparison
   * @param {string} headSha - Head commit SHA for comparison
   * @throws {Error} Not implemented
   */
  getChangedPackages(baseSha, headSha) {
    throw new Error(
      "ReleaseChangesInterface.getChangedPackages() not implemented",
    );
  }
}
