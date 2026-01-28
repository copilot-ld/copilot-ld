import { join, dirname } from "path";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { ProcessorBase } from "@copilot-ld/libutil/processor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically discovers and loads all step handlers from the steps directory.
 * @returns {Promise<Map<string, Function>>} Map of step names to their handler classes
 */
async function discoverSteps() {
  const stepsDir = join(__dirname, "steps");
  const files = await readdir(stepsDir);

  // Filter to only step implementation files (exclude tests, prompts, and base)
  const stepFiles = files.filter(
    (f) => f.endsWith(".js") && !f.endsWith(".test.js") && f !== "step-base.js",
  );

  const stepHandlers = new Map();

  for (const file of stepFiles) {
    const modulePath = join(stepsDir, file);
    const module = await import(modulePath);

    // Each step module exports STEP_NAME and a class (the default or named export)
    if (module.STEP_NAME) {
      // Find the step class - it's the export that's a function/class and not STEP_NAME
      const StepClass = Object.values(module).find(
        (exp) => typeof exp === "function" && exp !== module.STEP_NAME,
      );

      if (StepClass) {
        stepHandlers.set(module.STEP_NAME, StepClass);
      }
    }
  }

  return stepHandlers;
}

/**
 * Ingester scans the data/ingest folder for PDF files, moves each to a new folder named by its SHA256,
 * and creates a context.json file with metadata.
 * @class
 */
export class IngesterPipeline extends ProcessorBase {
  #ingestStorage;
  #configStorage;
  #config;
  #envConfig;
  #logger;
  #stepHandlers;

  /**
   * Create a new Ingester instance.
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
    this.#config = null;
    this.#envConfig = null;
    this.#logger = logger;
    this.#stepHandlers = null;
  }

  /**
   * Loads the ingest configuration.
   * @returns {Promise<object>} The config object
   */
  async #loadConfig() {
    const configData = await this.#configStorage.get("ingest.yml");
    const config = configData ? yaml.load(configData) : null;
    if (!config) {
      throw new Error("No ingest config found");
    }
    return config;
  }

  /**
   * Loads step handlers, caching them for reuse.
   * @returns {Promise<Map<string, Function>>} Map of step names to handler classes
   */
  async #loadStepHandlers() {
    if (!this.#stepHandlers) {
      this.#stepHandlers = await discoverSteps();
      this.#logger.debug("Pipeline", "Discovered steps", {
        count: this.#stepHandlers.size,
        steps: [...this.#stepHandlers.keys()].join(", "),
      });
    }
    return this.#stepHandlers;
  }

  /**
   * Loads the environment config for LLM access.
   * @returns {Promise<import("@copilot-ld/libconfig").Config>} Config instance
   */
  async #loadEnvConfig() {
    if (!this.#envConfig) {
      this.#envConfig = await createScriptConfig("ingest");
    }
    return this.#envConfig;
  }

  /**
   * Processes all files in the ingest 'pipeline' folder
   * @returns {Promise<void>}
   */
  async process() {
    // Load config if not already loaded
    if (!this.#config) {
      this.#config = await this.#loadConfig();
    }
    // Pre-load step handlers and env config
    await this.#loadStepHandlers();
    await this.#loadEnvConfig();
    const ingestStorage = this.#ingestStorage;
    // List all pipeline folders (e.g. pipeline/<sha256>/)
    const pipelineFolders = await ingestStorage.findByPrefix("pipeline/", "/");
    super.process(pipelineFolders);
  }

  /**
   * Processes a single pipeline folder by loading its context.json and logging step information.
   * @param {string} pipelineFolder The key representing the pipeline folder path
   */
  async processItem(pipelineFolder) {
    const ingestStorage = this.#ingestStorage;
    // Check for context.json in each folder
    const contextPath = join(pipelineFolder, "context.json");
    const exists = await ingestStorage.exists(contextPath);
    if (!exists) {
      throw new Error(`Missing context.json in ${pipelineFolder}`);
    }

    // Get cached step handlers and env config
    const stepHandlers = await this.#loadStepHandlers();
    const envConfig = await this.#loadEnvConfig();

    // Loop until all steps are completed
    while (true) {
      // Load context.json (reload each iteration to get updated state)
      const context = await ingestStorage.get(contextPath);
      if (!context || !context.steps) {
        throw new Error(
          `Invalid or missing steps in context.json for ${pipelineFolder}`,
        );
      }

      // Find steps in order
      const sortedSteps = Object.entries(context.steps).sort(
        ([, a], [, b]) => a.order - b.order,
      );

      // Find the next queued step
      const nextStep = sortedSteps.find(([, meta]) => meta.status === "QUEUED");
      if (!nextStep) {
        // No more queued steps - all done
        this.#logger.debug("Pipeline", "All steps completed", {
          folder: pipelineFolder,
        });
        break;
      }

      const [stepName] = nextStep;
      this.#logger.debug("Pipeline", "Processing step", {
        step: stepName,
        folder: pipelineFolder,
      });

      // Get the handler for this step
      const StepHandler = stepHandlers.get(stepName);
      if (!StepHandler) {
        throw new Error(`Unknown step: ${stepName}`);
      }

      // Get model config for this step
      const modelConfig = {
        model: this.#config.models?.[stepName],
        maxTokens: this.#config.defaults?.maxTokens,
      };

      // Create and run the step handler with injected config
      const handler = new StepHandler(
        ingestStorage,
        this.#logger,
        modelConfig,
        envConfig,
      );
      await handler.process(contextPath);
    }
  }
}
