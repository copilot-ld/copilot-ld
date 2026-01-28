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
   * Processes a single file from the input folder.
   * @param {string} key - Storage key of the file to process
   * @returns {Promise<void>}
   */
  async processItem(key) {
    const fileName = basename(key);
    const extension = extname(fileName);
    this.#logger.debug("Ingestor", "Ingesting file", { file_name: fileName });

    const buffer = await this.#ingestStorage.get(key);
    const targetDir = this.#computeTargetDir(buffer);

    await this.#ensureNotAlreadyProcessed(targetDir, fileName);
    await this.#storeTargetFile(targetDir, extension, buffer);

    const mimeType = await this.#getMimeType(buffer);
    const metadata = this.#buildMetadata(fileName, extension, mimeType);

    await this.#writeContext(targetDir, metadata);
    await this.#ingestStorage.delete(key);

    this.#logger.debug("Ingestor", "Ingested file and removed from in folder", {
      key,
      target_dir: targetDir,
    });
  }

  /**
   * Computes the target directory path based on file content hash.
   * @param {Buffer} buffer - File content
   * @returns {string} Target directory path
   */
  #computeTargetDir(buffer) {
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    return join("pipeline", sha256);
  }

  /**
   * Ensures the file has not already been processed.
   * @param {string} targetDir - Target directory path
   * @param {string} fileName - Original file name for error message
   * @throws {Error} If context.json already exists
   */
  async #ensureNotAlreadyProcessed(targetDir, fileName) {
    const contextPath = join(targetDir, "context.json");
    if (await this.#ingestStorage.exists(contextPath)) {
      throw new Error(
        `context.json already exists for ${fileName}. You may need to clean up a previous run.`,
      );
    }
  }

  /**
   * Stores the file in the target directory.
   * @param {string} targetDir - Target directory path
   * @param {string} extension - File extension
   * @param {Buffer} buffer - File content
   */
  async #storeTargetFile(targetDir, extension, buffer) {
    const targetPath = join(targetDir, "target" + extension);
    await this.#ingestStorage.put(targetPath, buffer);
  }

  /**
   * Builds metadata object for context.json.
   * @param {string} fileName - Original file name
   * @param {string} extension - File extension
   * @param {string} mimeType - Detected MIME type
   * @returns {object} Metadata object with steps
   */
  #buildMetadata(fileName, extension, mimeType) {
    const steps = this.#getStepsForMimeType(mimeType);
    const now = new Date().toISOString();

    return {
      originalName: fileName,
      extension: extension,
      mime: mimeType,
      dateCreated: now,
      lastUpdate: now,
      steps: steps,
    };
  }

  /**
   * Gets pipeline steps for a MIME type from config.
   * @param {string} mimeType - MIME type to lookup
   * @returns {object} Steps object with status and order
   * @throws {Error} If no steps configured for MIME type
   */
  #getStepsForMimeType(mimeType) {
    const stepNames = this.#config.steps[mimeType];
    if (!stepNames || !Array.isArray(stepNames)) {
      throw new Error(`No steps found in config for ${mimeType}`);
    }

    const steps = {};
    stepNames.forEach((step, idx) => {
      steps[step] = { status: "QUEUED", order: idx + 1 };
    });
    return steps;
  }

  /**
   * Writes context.json to the target directory.
   * @param {string} targetDir - Target directory path
   * @param {object} metadata - Metadata to write
   */
  async #writeContext(targetDir, metadata) {
    const contextPath = join(targetDir, "context.json");
    await this.#ingestStorage.put(
      contextPath,
      JSON.stringify(metadata, null, 2),
      "utf-8",
    );
  }

  /**
   * Gets the MIME type of a buffer using the system 'file' command.
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<string>} MIME type string
   * @throws {Error} If 'file' command is not found or fails
   */
  async #getMimeType(buffer) {
    await this.#ensureFileCommandExists();

    const tempFile = await this.#writeToTempFile(buffer);
    try {
      return await this.#detectMimeType(tempFile);
    } finally {
      await unlink(tempFile).catch(() => {});
    }
  }

  /** Verifies the 'file' command is available on the system. */
  async #ensureFileCommandExists() {
    await new Promise((resolve, reject) => {
      execFile("which", ["file"], (err, stdout) => {
        if (err || !stdout.trim()) {
          reject(new Error("'file' command not found on system"));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Writes buffer to a temporary file.
   * @param {Buffer} buffer - Content to write
   * @returns {Promise<string>} Path to temp file
   */
  async #writeToTempFile(buffer) {
    const tempDir = await mkdtemp(join(tmpdir(), "ingest-"));
    const tempFile = join(tempDir, `tmpfile-${Date.now()}`);
    await writeFile(tempFile, buffer);
    return tempFile;
  }

  /**
   * Runs the 'file' command to detect MIME type.
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} MIME type
   */
  async #detectMimeType(filePath) {
    return new Promise((resolve, reject) => {
      execFile("file", ["--mime-type", "-b", filePath], (err, stdout) => {
        if (err) {
          reject(new Error(`Failed to get MIME type: ${err.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
}
