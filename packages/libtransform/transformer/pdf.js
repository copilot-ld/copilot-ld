/* eslint-env node */
import { spawn, spawnSync } from "child_process";
import { mkdtemp, writeFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { ProcessorBase } from "@copilot-ld/libutil";

/**
 * PdfTransformer converts PDF files in knowledge storage to HTML using Copilot vision.
 * Each PDF is split into images, each image is sent to Copilot for HTML conversion,
 * and all HTML fragments are merged into a single HTML document.
 */
export class PdfTransformer extends ProcessorBase {
  #knowledgeStorage;
  #llm;
  #logger;
  #systemPrompt;
  #userPrompt;
  #model;
  #maxTokens;

  /**
   * Creates a new PdfTransformer instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} knowledgeStorage - Storage backend for PDF files
   * @param {object} llm - Copilot LLM client with imageToText(image, systemPrompt, prompt, model, max_tokens) method
   * @param {object} logger - Logger instance with debug() method
   * @param {object} [options] - Optional configuration
   * @param {string} [options.systemPrompt] - System prompt for Copilot
   * @param {string} [options.userPrompt] - User prompt for Copilot
   * @param {string} [options.model] - Model name for Copilot
   * @param {number} [options.maxTokens] - Max tokens for Copilot response
   * @throws {Error} If pdftoppm is not available
   */
  constructor(knowledgeStorage, llm, logger, options = {}) {
    super(logger, 5);

    if (!knowledgeStorage) throw new Error("knowledgeStorage is required");
    if (!llm) throw new Error("llm is required");
    if (!logger) throw new Error("logger is required");
    if (!this.#isPdftoppmAvailable()) {
      throw new Error("pdftoppm is not installed or not available in PATH");
    }

    this.#knowledgeStorage = knowledgeStorage;
    this.#llm = llm;
    this.#logger = logger;
    this.#systemPrompt =
      options.systemPrompt ||
      "You are an expert in HTML and Schema.org microdata. Extract text from the provided image and convert it into valid class-less HTML with appropriate Schema.org microdata attributes. Assume the image is one of many, so create fragments of HTML that will be combined to produce a single HTML file at the end of the process. These images may contain Gantt charts and graphs. Use only valid Schema.org types and properties from https://schema.org. Output only the HTML without any explanation or markdown code blocks.";
    this.#userPrompt = options.userPrompt || "What is in this image?";
    this.#model = options.model || "gpt-4o";
    this.#maxTokens = options.maxTokens || 2000;
  }

  /**
   * Converts all PDF files in knowledge storage to HTML and stores them.
   * @param {string} pdfExtension - File extension to filter by (default: ".pdf")
   * @param {string} htmlExtension - Output HTML extension (default: ".html")
   * @returns {Promise<void>}
   */
  async process(pdfExtension = ".pdf", htmlExtension = ".html") {
    const keys = await this.#knowledgeStorage.findByExtension(pdfExtension);

    this.#logger.debug(`Found ${keys.length} PDF files to process`);
    for (const key of keys) {
      this.#logger.debug("Processing PDF", { key });

      const pdfBuffer = await this.#knowledgeStorage.get(key);
      if (!Buffer.isBuffer(pdfBuffer)) {
        this.#logger.debug("Skipping non-buffer PDF", { key });
        continue;
      }

      const html = await this.#pdfToHtml(pdfBuffer, key);

      const htmlKey = key.replace(/\.pdf$/i, htmlExtension);
      await this.#knowledgeStorage.put(htmlKey, html);

      this.#logger.debug("Converted PDF to HTML", { key, htmlKey });
    }
  }

  /**
   * Converts a PDF buffer to a single merged HTML document using Copilot vision.
   * Splits PDF into images, sends each image to Copilot, and merges HTML fragments.
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} key - Storage key for logging
   * @returns {Promise<string>} Merged HTML document
   */
  async #pdfToHtml(pdfBuffer, key) {
    const images = await this.#pdfSplitter(pdfBuffer, key);

    this.#logger.debug("Split PDF into images", {
      key,
      imageCount: images.length,
    });

    const htmlFragments = [];
    for (const [i, image] of images.entries()) {
      this.#logger.debug("Sending image to Copilot", { key, page: i + 1 });

      const htmlContent = await this.#llm.imageToText(
        image,
        this.#userPrompt,
        this.#model,
        this.#systemPrompt,
        this.#maxTokens,
      );

      if (htmlContent && htmlContent.length > 0) {
        this.#logger.debug("Received HTML from Copilot", {
          key,
          page: i + 1,
          contentLength: htmlContent.length,
        });
        htmlFragments.push(htmlContent);
      } else {
        this.#logger.debug("Got an empty response from Copilot for image", {
          key,
          page: i + 1,
        });
      }
    }

    const mergedHtml = [
      "<!DOCTYPE html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${key} - PDF to HTML</title></head>`,
      "<body>",
      ...htmlFragments,
      "</body>",
      "</html>",
    ].join("\n");

    this.#logger.debug("Merged HTML fragments", {
      key,
      fragmentCount: htmlFragments.length,
    });

    return mergedHtml;
  }

  /**
   * Splits a PDF buffer into an array of image file paths using pdftoppm.
   * Each page is converted to a PNG image in a temporary directory.
   * Removes the temporary directory after processing completes or fails.
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} key - Storage key for logging
   * @returns {Promise<string[]>} Array of PNG image file paths (one per page)
   * @throws {Error} If pdftoppm fails or images cannot be generated
   */
  async #pdfSplitter(pdfBuffer, key) {
    // Create a temporary directory for images
    const tempDir = await mkdtemp(join(tmpdir(), "pdfsplit-"));
    try {
      const pdfPath = join(tempDir, "input.pdf");
      await writeFile(pdfPath, pdfBuffer);

      // pdftoppm command: pdftoppm input.pdf page -png
      const outputPrefix = join(tempDir, "page");
      await new Promise((resolve, reject) => {
        const proc = spawn("pdftoppm", [pdfPath, outputPrefix, "-png"]);
        proc.on("error", reject);
        proc.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`pdftoppm exited with code ${code}`));
        });
      });

      const files = await readdir(tempDir);
      const imageFiles = files
        .filter((f) => /^page-\d+\.png$/.test(f))
        .sort((a, b) => {
          // Extract page numbers from filenames
          const aNum = parseInt(a.match(/^page-(\d+)\.png$/)[1], 10);
          const bNum = parseInt(b.match(/^page-(\d+)\.png$/)[1], 10);
          return aNum - bNum;
        })
        .map((f) => join(tempDir, f));

      if (imageFiles.length === 0) {
        throw new Error("No images generated from PDF");
      }

      this.#logger.debug("Generated images from PDF", { key, imageFiles });
      return imageFiles;
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Checks that pdftoppm is installed and available in PATH.
   * @returns {boolean} True if pdftoppm is available, false otherwise
   */
  #isPdftoppmAvailable() {
    const result = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
    return (
      result.status === 0 ||
      (result.stdout && result.stdout.includes("pdftoppm"))
    );
  }
}
