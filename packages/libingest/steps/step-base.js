import { dirname } from "node:path";
import { createLlmApi } from "@copilot-ld/libllm";
import { Utils } from "../utils.js";

/** @type {number} Default max tokens for LLM completions */
export const DEFAULT_MAX_TOKENS = 5000;

/** @type {string} Default model for text completions */
export const DEFAULT_MODEL = "gpt-4o";

/**
 * @typedef {object} ModelConfig
 * @property {string} [model] - Model to use for LLM calls
 * @property {number} [maxTokens] - Max tokens for LLM completions
 */

/**
 * Base class for ingest pipeline steps.
 *
 * Provides common functionality:
 * - Storage access
 * - Logging
 * - Loading/saving ingest context
 * - Step validation
 * - Model configuration
 */
export class StepBase {
  /** @type {import("@copilot-ld/libstorage").StorageInterface} */
  _ingestStorage;

  /** @type {object} */
  _logger;

  /** @type {ModelConfig} */
  _modelConfig;

  /**
   * The step name for this ingest step.
   * Must be overridden by subclasses, and should match the step name exported from the module.
   * @type {string}
   */
  static STEP_NAME = "";

  /**
   * Create a new step instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {ModelConfig} [modelConfig] Optional model configuration
   */
  constructor(ingestStorage, logger, modelConfig = {}) {
    if (!ingestStorage) throw new Error("ingestStorage is required");
    if (!logger) throw new Error("logger is required");

    this._ingestStorage = ingestStorage;
    this._logger = logger;
    this._modelConfig = modelConfig;
  }

  /**
   * Gets the configured model or falls back to default.
   * @returns {string} Model name
   */
  getModel() {
    return this._modelConfig.model || DEFAULT_MODEL;
  }

  /**
   * Gets the configured max tokens or falls back to default.
   * @returns {number} Max tokens
   */
  getMaxTokens() {
    return this._modelConfig.maxTokens || DEFAULT_MAX_TOKENS;
  }

  /**
   * Process the step - must be implemented by subclasses.
   * @param {string} _ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(_ingestContextKey) {
    throw new Error("process() must be implemented by subclass");
  }

  /**
   * Loads and validates ingest context from storage.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<object>} Validated ingest context object
   */
  async loadIngestContext(ingestContextKey) {
    const ingestContext = await this._ingestStorage.get(ingestContextKey);
    if (!ingestContext || typeof ingestContext !== "object") {
      throw new Error(`Invalid ingest context for key: ${ingestContextKey}`);
    }
    return ingestContext;
  }

  /**
   * Gets and validates the step metadata from the ingest context.
   * @param {object} ingestContext Ingest context object
   * @param {string} stepName Name of the step to get
   * @param {string} ingestContextKey Key for error messages
   * @returns {object} Step metadata object
   */
  getStep(ingestContext, stepName, ingestContextKey) {
    const step = ingestContext.steps[stepName];
    if (!step) {
      throw new Error(
        `Step "${stepName}" not found in the context: ${ingestContextKey}`,
      );
    }
    return step;
  }

  /**
   * Gets the target directory from the ingest context key.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {string} Target directory path
   */
  getTargetDir(ingestContextKey) {
    return dirname(ingestContextKey);
  }

  /**
   * Saves the ingest context back to storage.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @param {object} ingestContext Ingest context object to save
   * @returns {Promise<void>}
   */
  async saveIngestContext(ingestContextKey, ingestContext) {
    ingestContext.lastUpdate = new Date().toISOString();
    await this._ingestStorage.put(
      ingestContextKey,
      JSON.stringify(ingestContext, null, 2),
      "utf-8",
    );
  }

  /**
   * Marks the step as completed and saves the context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @param {object} ingestContext Ingest context object
   * @param {object} step Step metadata object
   * @param {object} updates Additional properties to set on the step
   * @returns {Promise<void>}
   */
  async completeStep(ingestContextKey, ingestContext, step, updates = {}) {
    Object.assign(step, updates);
    step.status = "COMPLETED";
    await this.saveIngestContext(ingestContextKey, ingestContext);
  }

  /**
   * Creates an LLM client using the LLM token and configured model.
   * @returns {object} LLM client instance
   */
  createLlm() {
    return createLlmApi(
      Utils.getLlmToken(),
      this.getModel(),
      Utils.getLlmBaseUrl(),
      Utils.getEmbeddingBaseUrl(),
    );
  }

  /**
   * Gets data from a previous step with validation.
   * @param {object} ingestContext Ingest context object
   * @param {string} stepName Name of the previous step
   * @param {string} propertyName Property to retrieve from the step
   * @param {string} ingestContextKey Key for error messages
   * @returns {*} The requested property value
   * @throws {Error} If step or property not found
   */
  getPreviousStepData(ingestContext, stepName, propertyName, ingestContextKey) {
    const step = ingestContext.steps[stepName];
    if (!step || step[propertyName] === undefined) {
      throw new Error(
        `No ${propertyName} found from ${stepName} step: ${ingestContextKey}`,
      );
    }
    return step[propertyName];
  }
}
