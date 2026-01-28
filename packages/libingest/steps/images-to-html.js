import { STEP_NAME as PDF_TO_IMAGES_STEP } from "./pdf-to-images.js";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "images-to-html";

/** @type {string[]} MIME types that are directly processable as images */
const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/**
 * ImagesToHtml step: Converts images to HTML using Copilot vision.
 *
 * Workflow:
 * - For PDFs: Loads images from storage (from previous pdf-to-images step)
 * - For images: Uses the source image directly
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
   * @param {import("./step-base.js").ModelConfig} modelConfig Model configuration
   * @param {import("@copilot-ld/libconfig").Config} config Config instance for environment access
   */
  constructor(ingestStorage, logger, modelConfig, config) {
    super(ingestStorage, logger, modelConfig, config);

    this.#imgToHtmlSystemPrompt = this.loadPrompt(
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

    // Get image keys - either from pdf-to-images step or from the source image
    const imageKeys = this.#getImageKeys(ingestContext, targetDir);

    // Create LLM after validation
    const llm = await this.createLlm();

    this.logger.debug("ImagesToHtml", "Processing images to HTML", {
      count: imageKeys.length,
    });

    const htmlFragments = [];

    for (const [i, imageKey] of imageKeys.entries()) {
      this.logger.debug("ImagesToHtml", "Processing image", {
        page: i + 1,
        key: imageKey,
      });

      const imageBuffer = await this.ingestStorage.get(imageKey);
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
        this.logger.debug(
          `Received HTML from Copilot, page: ${i + 1}, contentLength: ${htmlContent.length}`,
        );
        htmlFragments.push(htmlContent);
      } else {
        this.logger.debug(
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
    await this.ingestStorage.put(htmlKey, mergedHtml);
    this.logger.debug(`Saved merged HTML to ${htmlKey}`);

    // Save individual fragments to storage
    const fragmentKeys = [];
    for (const [i, fragment] of htmlFragments.entries()) {
      const fragmentKey = `${targetDir}/fragment-${String(i + 1).padStart(3, "0")}.html`;
      await this.ingestStorage.put(fragmentKey, fragment);
      fragmentKeys.push(fragmentKey);
    }
    this.logger.debug(`Saved ${fragmentKeys.length} HTML fragments`);

    await this.completeStep(ingestContextKey, ingestContext, step, {
      htmlKey,
      fragmentKeys,
      fragmentCount: htmlFragments.length,
    });
  }

  /**
   * Gets image keys based on the source type.
   * For PDFs, returns image keys from the pdf-to-images step.
   * For direct image uploads, returns the source image path.
   * @param {object} ingestContext Ingest context object
   * @param {string} targetDir Directory containing the ingested files
   * @returns {string[]} Array of image keys
   */
  #getImageKeys(ingestContext, targetDir) {
    // Check if pdf-to-images step exists and has imageKeys
    const pdfStep = ingestContext.steps[PDF_TO_IMAGES_STEP];
    if (pdfStep && pdfStep.imageKeys) {
      return pdfStep.imageKeys;
    }

    // For direct image uploads, use the source image
    if (IMAGE_MIME_TYPES.includes(ingestContext.mime)) {
      const imageKey = `${targetDir}/target${ingestContext.extension}`;
      return [imageKey];
    }

    throw new Error(
      `No image source found: expected ${PDF_TO_IMAGES_STEP} step with imageKeys or image MIME type`,
    );
  }
}
