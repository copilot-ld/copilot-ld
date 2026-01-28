import { join, dirname } from "path";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";

import yaml from "js-yaml";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { PromptLoader } from "@copilot-ld/libprompt";
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
  #ingestConfig;
  #config;
  #logger;
  #stepHandlers;
  #promptLoader;

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
    this.#ingestConfig = null;
    this.#config = null;
    this.#logger = logger;
    this.#stepHandlers = null;
    this.#promptLoader = new PromptLoader(join(__dirname, "prompts"));
  }

  /**
   * Loads the ingest configuration.
   * @returns {Promise<object>} The config object
   */
  async #loadIngestConfig() {
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
  async #loadConfig() {
    if (!this.#config) {
      this.#config = await createScriptConfig("ingest");
    }
    return this.#config;
  }

  /**
   * Processes all files in the ingest 'pipeline' folder
   * @returns {Promise<void>}
   */
  async process() {
    // Load config if not already loaded
    if (!this.#ingestConfig) {
      this.#ingestConfig = await this.#loadIngestConfig();
    }
    // Pre-load step handlers and config
    await this.#loadStepHandlers();
    await this.#loadConfig();
    const ingestStorage = this.#ingestStorage;
    // List all pipeline folders (e.g. pipeline/<sha256>/)
    const pipelineFolders = await ingestStorage.findByPrefix("pipeline/", "/");
    super.process(pipelineFolders);
  }

  /**
   * Processes a single pipeline folder by executing steps until completion.
   * @param {string} pipelineFolder - The key representing the pipeline folder path
   */
  async processItem(pipelineFolder) {
    const contextPath = join(pipelineFolder, "context.json");
    await this.#ensureContextExists(pipelineFolder, contextPath);

    const stepHandlers = await this.#loadStepHandlers();
    const config = await this.#loadConfig();

    while (true) {
      const context = await this.#loadContext(pipelineFolder, contextPath);
      const nextStep = this.#findNextQueuedStep(context.steps);

      if (!nextStep) {
        this.#logger.debug("Pipeline", "All steps completed", {
          folder: pipelineFolder,
        });
        break;
      }

      await this.#executeStep(
        nextStep,
        contextPath,
        pipelineFolder,
        stepHandlers,
        config,
      );
    }
  }

  /**
   * Ensures context.json exists in the pipeline folder.
   * @param {string} pipelineFolder - Pipeline folder path
   * @param {string} contextPath - Path to context.json
   * @throws {Error} If context.json is missing
   */
  async #ensureContextExists(pipelineFolder, contextPath) {
    const exists = await this.#ingestStorage.exists(contextPath);
    if (!exists) {
      throw new Error(`Missing context.json in ${pipelineFolder}`);
    }
  }

  /**
   * Loads and validates context.json.
   * @param {string} pipelineFolder - Pipeline folder path
   * @param {string} contextPath - Path to context.json
   * @returns {Promise<object>} Parsed context object
   * @throws {Error} If context is invalid
   */
  async #loadContext(pipelineFolder, contextPath) {
    const context = await this.#ingestStorage.get(contextPath);
    if (!context || !context.steps) {
      throw new Error(
        `Invalid or missing steps in context.json for ${pipelineFolder}`,
      );
    }
    return context;
  }

  /**
   * Finds the next queued step in order.
   * @param {object} steps - Steps object from context
   * @returns {[string, object]|undefined} Next step entry or undefined if none
   */
  #findNextQueuedStep(steps) {
    const sortedSteps = Object.entries(steps).sort(
      ([, a], [, b]) => a.order - b.order,
    );
    return sortedSteps.find(([, meta]) => meta.status === "QUEUED");
  }

  /**
   * Executes a single pipeline step.
   * @param {[string, object]} stepEntry - Step name and metadata
   * @param {string} contextPath - Path to context.json
   * @param {string} pipelineFolder - Pipeline folder path
   * @param {Map<string, Function>} stepHandlers - Map of step handlers
   * @param {import("@copilot-ld/libconfig").Config} config - Configuration
   */
  async #executeStep(
    stepEntry,
    contextPath,
    pipelineFolder,
    stepHandlers,
    config,
  ) {
    const [stepName] = stepEntry;
    this.#logger.debug("Pipeline", "Processing step", {
      step: stepName,
      folder: pipelineFolder,
    });

    const StepHandler = stepHandlers.get(stepName);
    if (!StepHandler) {
      throw new Error(`Unknown step: ${stepName}`);
    }

    const handler = this.#createStepHandler(StepHandler, stepName, config);
    await handler.process(contextPath);
  }

  /**
   * Creates a step handler instance with dependencies.
   * @param {Function} StepHandler - Step handler class
   * @param {string} stepName - Name of the step for config lookup
   * @param {import("@copilot-ld/libconfig").Config} config - Configuration
   * @returns {object} Step handler instance
   */
  #createStepHandler(StepHandler, stepName, config) {
    const modelConfig = {
      model: this.#ingestConfig.models?.[stepName],
      maxTokens: this.#ingestConfig.defaults?.maxTokens,
    };

    return new StepHandler(
      this.#ingestStorage,
      this.#logger,
      modelConfig,
      config,
      this.#promptLoader,
    );
  }
}

