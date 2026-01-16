import { createHash } from "crypto";
import { ProcessorBase } from "@copilot-ld/libutil/processor.js";
import yaml from "js-yaml";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname, basename } from "node:path";

/**
 * IngesterLoad scans the data/ingest/in folder for files, moves each to a new folder named by its SHA256,
 * and creates a context.json file with metadata and pipeline steps.
 * @class
 */
export class IngesterLoad extends ProcessorBase {
  #ingestStorage;
  #configStorage;
  #config;
  #logger;

  /**
   * Create a new IngesterLoad instance.
   * @param {object} ingestStorage - Storage backend for ingest files
   * @param {object} configStorage - Storage backend for config files
   * @param {object} [logger] - Logger with debug/info methods
   * @param {number} [batchSize] - Optional batch size for processing
   */
  constructor(ingestStorage, configStorage, logger = console, batchSize = 20) {
    super(logger, batchSize);
    if (!ingestStorage) throw new Error("ingestStorage backend is required");
    if (!configStorage) throw new Error("configStorage backend is required");
    this.#ingestStorage = ingestStorage;
    this.#configStorage = configStorage;
    this.#logger = logger;
    // Config must be loaded asynchronously after construction
    this.#config = null;
  }

  /**
   * Loads and flattens the ingest config steps.
   * @returns {Promise<object|null>} The processed config object or null
   */
  async #loadConfig() {
    const configData = await this.#configStorage.get("ingest.yml");
    let config = configData ? yaml.load(configData) : null;
    if (!config || !config.steps || Object.keys(config.steps).length === 0) {
      throw new Error(`No steps found in config`);
    }
    return config;
  }

  /**
   * Processes all files in the ingest 'todo' folder, moves them to 'wip', and creates context.json metadata.
   * Loads config if not already loaded, detects MIME type, and applies config-driven steps.
   * @returns {Promise<void>}
   */
  async process() {
    // Load config if not already loaded
    if (!this.#config) {
      this.#config = await this.#loadConfig();
    }

    const ingestStorage = this.#ingestStorage;
    // List files in the in subfolder
    super.process(await ingestStorage.findByPrefix("in"));
  }

  /**
   * Processes a single item (must be implemented by subclass)
   * @param {string} key - Storage key of the file to process
   * @returns {Promise<any>} Processed result
   */
  async processItem(key) {
    const ingestStorage = this.#ingestStorage;
    const fileName = basename(key);
    const extension = extname(fileName);
    this.#logger.debug("Ingestor", "Ingesting file", { file_name: fileName });
    const buffer = await ingestStorage.get(key);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const targetDir = join("pipeline", sha256);
    const contextPath = join(targetDir, "context.json");

    // Check if context.json already exists
    if (await ingestStorage.exists(contextPath)) {
      throw new Error(
        `context.json already exists for ${fileName}. You may need to clean up a previous run.`,
      );
    }

    const targetPath = join(targetDir, "target" + extension);
    await ingestStorage.put(targetPath, buffer);
    const now = new Date().toISOString();
    const mimeType = await this.#getMimeType(buffer);
    // Lookup steps in config by mime type
    let steps = this.#config.steps[mimeType];
    if (!steps || !Array.isArray(steps)) {
      throw new Error(`No steps found in config for ${mimeType}`);
    }
    const stepsObj = {};
    steps.forEach((step, idx) => {
      stepsObj[step] = { status: "QUEUED", order: idx + 1 };
    });
    const metadata = {
      originalName: fileName,
      extension: extension,
      mime: mimeType,
      dateCreated: now,
      lastUpdate: now,
      steps: stepsObj,
    };

    await ingestStorage.put(
      contextPath,
      JSON.stringify(metadata, null, 2),
      "utf-8",
    );
    // Remove the original file from the 'todo' folder
    await ingestStorage.delete(key);
    this.#logger.debug("Ingestor", "Ingested file and removed from in folder", {
      key,
      target_dir: targetDir,
    });
  }

  /**
   * Gets the MIME type of a buffer using the Linux 'file' command.
   * Throws if 'file' command is not found.
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<string>} MIME type string
   */
  async #getMimeType(buffer) {
    // Check if 'file' command exists
    await new Promise((resolve, reject) => {
      execFile("which", ["file"], (err, stdout) => {
        if (err || !stdout.trim()) {
          reject(new Error("'file' command not found on system"));
        } else {
          resolve();
        }
      });
    });
    // Write buffer to temp file
    const tempDir = await mkdtemp(join(tmpdir(), "ingest-"));
    const tempFile = join(tempDir, `tmpfile-${Date.now()}`);
    await writeFile(tempFile, buffer);
    // Run 'file --mime-type'
    const mimeType = await new Promise((resolve, reject) => {
      execFile("file", ["--mime-type", "-b", tempFile], (err, stdout) => {
        if (err) {
          reject(new Error(`Failed to get MIME type: ${err.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
    // Clean up temp file and directory
    await unlink(tempFile).catch(() => {});
    // Optionally remove tempDir (not strictly necessary, OS will clean up)
    return mimeType;
  }
}
