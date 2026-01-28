import { common } from "@copilot-ld/libtype";
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
   * @param {import("./step-base.js").ModelConfig} modelConfig Model configuration
   * @param {import("@copilot-ld/libconfig").Config} config Config instance for environment access
   * @param {import("@copilot-ld/libprompt").PromptLoader} [promptLoader] Optional prompt loader for templates
   */
  constructor(ingestStorage, logger, modelConfig, config, promptLoader) {
    super(ingestStorage, logger, modelConfig, config, promptLoader);

    this.#contextExtractorSystemPrompt = this.loadPrompt(
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

    this.logger.debug(`Extracting context from HTML: ${htmlKey}`);

    // Load HTML from storage
    const rawHtml = await this.ingestStorage.get(htmlKey);
    if (!rawHtml) {
      throw new Error(`No HTML content found for key: ${htmlKey}`);
    }
    // Convert Buffer to string if needed
    const html = Buffer.isBuffer(rawHtml) ? rawHtml.toString("utf-8") : rawHtml;
    if (typeof html !== "string") {
      throw new Error(`Invalid HTML content for key: ${htmlKey}`);
    }

    // Create LLM after validation
    const llm = await this.createLlm();

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

    this.logger.debug(
      "ExtractContext",
      "Sending HTML to Copilot for context extraction",
    );

    const response = await llm.createCompletions({
      messages,
      max_tokens: this.getMaxTokens(),
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error(
        "Got an empty response from Copilot for context extraction",
      );
    }

    const contextJson = response.choices[0].message?.content || "";
    this.logger.debug(
      `Received context from Copilot, length: ${contextJson.length}`,
    );

    // Save document context to storage
    const contextKey = `${targetDir}/document-context.json`;
    await this.ingestStorage.put(contextKey, contextJson);
    this.logger.debug(`Saved document context to ${contextKey}`);

    await this.completeStep(ingestContextKey, ingestContext, step, {
      contextKey,
    });
  }
}
