import { Utils } from "../utils.js";
import { STEP_NAME as PDF_TO_IMAGES_STEP } from "./pdf-to-images.js";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "images-to-html";

/**
 * ImagesToHtml step: Converts images to HTML using Copilot vision.
 *
 * Workflow:
 * - Loads images from storage (from previous pdf-to-images step)
 * - Sends each image to Copilot for HTML conversion
 * - Merges HTML fragments into a single document
 * - Updates ingest context with HTML key
 */
export class ImagesToHtml extends StepBase {
  #imgToHtmlSystemPrompt;

  /**
   * Create a new ImagesToHtml instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {import("./step-base.js").ModelConfig} [modelConfig] Optional model configuration
   */
  constructor(ingestStorage, logger, modelConfig) {
    super(ingestStorage, logger, modelConfig);

    this.#imgToHtmlSystemPrompt = Utils.loadPrompt(
      "image-to-html-prompt.md",
      import.meta.dirname,
    );
  }

  /**
   * Converts images in storage to HTML and updates ingest context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(ingestContextKey) {
    const ingestContext = await this.loadIngestContext(ingestContextKey);
    const step = this.getStep(ingestContext, STEP_NAME, ingestContextKey);
    const targetDir = this.getTargetDir(ingestContextKey);

    // Get image keys from the previous step (pdf-to-images)
    const imageKeys = this.getPreviousStepData(
      ingestContext,
      PDF_TO_IMAGES_STEP,
      "imageKeys",
      ingestContextKey,
    );

    // Create LLM after validation
    const llm = this.createLlm();

    this._logger.debug("ImagesToHtml", "Processing images to HTML", {
      count: imageKeys.length,
    });

    const htmlFragments = [];

    for (const [i, imageKey] of imageKeys.entries()) {
      this._logger.debug("ImagesToHtml", "Processing image", {
        page: i + 1,
        key: imageKey,
      });

      const imageBuffer = await this._ingestStorage.get(imageKey);
      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error(`Got a non-buffer image ${imageKey}`);
      }

      const htmlContent = await llm.imageToText(
        imageBuffer,
        `This is the image of page ${i + 1}. Convert it to HTML.`,
        this.getModel(),
        this.#imgToHtmlSystemPrompt,
        this.getMaxTokens(),
      );

      if (htmlContent && htmlContent.length > 0) {
        this._logger.debug(
          `Received HTML from Copilot, page: ${i + 1}, contentLength: ${htmlContent.length}`,
        );
        htmlFragments.push(htmlContent);
      } else {
        this._logger.debug(
          `Got an empty response from Copilot for image, page: ${i + 1}`,
        );
      }
    }

    // Merge HTML fragments
    const mergedHtml = [
      "<!DOCTYPE html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${ingestContext.filename}</title></head>`,
      "<body>",
      ...htmlFragments,
      "</body>",
      "</html>",
    ].join("\n");

    // Save merged HTML to storage
    const htmlKey = `${targetDir}/target.html`;
    await this._ingestStorage.put(htmlKey, mergedHtml);
    this._logger.debug(`Saved merged HTML to ${htmlKey}`);

    // Save individual fragments to storage
    const fragmentKeys = [];
    for (const [i, fragment] of htmlFragments.entries()) {
      const fragmentKey = `${targetDir}/fragment-${String(i + 1).padStart(3, "0")}.html`;
      await this._ingestStorage.put(fragmentKey, fragment);
      fragmentKeys.push(fragmentKey);
    }
    this._logger.debug(`Saved ${fragmentKeys.length} HTML fragments`);

    await this.completeStep(ingestContextKey, ingestContext, step, {
      htmlKey,
      fragmentKeys,
      fragmentCount: htmlFragments.length,
    });
  }
}
