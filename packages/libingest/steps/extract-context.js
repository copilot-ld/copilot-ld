import { common } from "@copilot-ld/libtype";
import { Utils } from "../utils.js";
import { STEP_NAME as IMAGES_TO_HTML_STEP } from "./images-to-html.js";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "extract-context";

/**
 * ExtractContext step: Analyzes HTML and extracts structured context.
 *
 * Workflow:
 * - Loads HTML from storage (from previous images-to-html step)
 * - Sends HTML to Copilot for context extraction
 * - Stores structured JSON context
 * - Updates ingest context with context key
 */
export class ExtractContext extends StepBase {
  #contextExtractorSystemPrompt;

  /**
   * Create a new ExtractContext instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {import("./step-base.js").ModelConfig} [modelConfig] Optional model configuration
   */
  constructor(ingestStorage, logger, modelConfig) {
    super(ingestStorage, logger, modelConfig);

    this.#contextExtractorSystemPrompt = Utils.loadPrompt(
      "context-extractor-prompt.md",
      import.meta.dirname,
    );
  }

  /**
   * Extracts context from HTML and updates ingest context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(ingestContextKey) {
    const ingestContext = await this.loadIngestContext(ingestContextKey);
    const step = this.getStep(ingestContext, STEP_NAME, ingestContextKey);
    const targetDir = this.getTargetDir(ingestContextKey);

    // Get HTML key from the previous step (images-to-html)
    const htmlKey = this.getPreviousStepData(
      ingestContext,
      IMAGES_TO_HTML_STEP,
      "htmlKey",
      ingestContextKey,
    );

    this._logger.debug(`Extracting context from HTML: ${htmlKey}`);

    // Load HTML from storage
    const rawHtml = await this._ingestStorage.get(htmlKey);
    if (!rawHtml || typeof rawHtml !== "string") {
      throw new Error(`Invalid HTML content for key: ${htmlKey}`);
    }
    const html = rawHtml;

    // Create LLM after validation
    const llm = this.createLlm();

    // Extract context using LLM
    const messages = [
      common.Message.fromObject({
        role: "system",
        content: this.#contextExtractorSystemPrompt,
      }),
      common.Message.fromObject({
        role: "user",
        content: html,
      }),
    ];

    this._logger.debug(
      "ExtractContext",
      "Sending HTML to Copilot for context extraction",
    );

    const response = await llm.createCompletions(
      messages,
      undefined,
      undefined,
      this.getMaxTokens(),
    );

    if (!response.choices || response.choices.length === 0) {
      throw new Error(
        "Got an empty response from Copilot for context extraction",
      );
    }

    const contextJson = response.choices[0].message?.content || "";
    this._logger.debug(
      `Received context from Copilot, length: ${contextJson.length}`,
    );

    // Save document context to storage
    const contextKey = `${targetDir}/document-context.json`;
    await this._ingestStorage.put(contextKey, contextJson);
    this._logger.debug(`Saved document context to ${contextKey}`);

    await this.completeStep(ingestContextKey, ingestContext, step, {
      contextKey,
    });
  }
}
