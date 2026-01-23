import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Class to hold some utils for libingest
 */
export class Utils {
  /**
   * Loads a prompt file by name from the current directory.
   * Checks if the file exists before reading.
   * @param {string} promptName - Name of the prompt file to load
   * @param {string} [baseDir] - Optional base directory to resolve from
   * @returns {string} Prompt file contents as a string
   * @throws {Error} If promptName is not supplied or file does not exist
   */
  static loadPrompt(promptName, baseDir = __dirname) {
    if (!promptName) {
      throw new Error("promptName must be supplied");
    }
    const promptPath = join(baseDir, promptName);
    if (!existsSync(promptPath)) {
      throw new Error(`Prompt file does not exist: ${promptPath}`);
    }
    return readFileSync(promptPath, { encoding: "utf-8" });
  }

  /**
   * Checks if pdftoppm command is available on the system.
   * @returns {boolean} True if pdftoppm is available, false otherwise
   */
  static isPdftoppmAvailable() {
    const result = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
    return result.status === 0 || Boolean(result.stdout?.includes("pdftoppm"));
  }

  /**
   * Gets the LLM token from environment variable
   * @returns {string} LLM API token
   */
  static getLlmToken() {
    const processEnv = globalThis.process.env;
    if (processEnv.LLM_TOKEN) {
      return processEnv.LLM_TOKEN;
    }

    throw new Error("LLM token not found in environment");
  }

  /**
   * Gets the LLM base URL from environment variable
   * @returns {string} LLM API base URL
   * @throws {Error} If LLM_BASE_URL is not set
   */
  static getLlmBaseUrl() {
    if (!globalThis.process.env.LLM_BASE_URL) {
      throw new Error(
        "LLM_BASE_URL not found in environment. Set to https://models.github.ai/orgs/{YOUR_ORG} for org-level PATs.",
      );
    }
    return globalThis.process.env.LLM_BASE_URL;
  }
}
