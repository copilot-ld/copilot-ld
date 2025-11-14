/* eslint-env node */
import { spawn, spawnSync } from "child_process";
import { mkdtemp, writeFile, readdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { ProcessorBase } from "@copilot-ld/libutil";

/**
 * PdfTransform converts PDF files in knowledge storage to HTML using Copilot vision.
 * Each PDF is split into images, each image is sent to Copilot for HTML conversion,
 * and all HTML fragments are merged into a single HTML document.
 */
export class PdfTransform extends ProcessorBase {
  #knowledgeStorage;
  #llm;
  #logger;

  /**
   * Creates a new PdfTransform instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} knowledgeStorage - Storage backend for PDF files
   * @param {object} llm - Copilot LLM client with imageToText(image, systemPrompt, prompt, model, max_tokens) method
   * @param {object} logger - Logger instance with debug() method
   * @throws {Error} If pdftoppm is not available
   */
  constructor(knowledgeStorage, llm, logger) {
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

      const systemPrompt =
        "You are an expert in HTML and Schema.org microdata. Extract text from the provided image and convert it into valid class-less HTML with appropriate Schema.org microdata attributes. Assume the image is one of many, so create fragments of HTML that will be combined to produce a single HTML file at the end of the process. These images may contain gant charts and graphs. Use only valid Schema.org types and properties from https://schema.org. Output only the HTML without any explanation or markdown code blocks.";

      const prompt = "What is in this image?";
      const model = "gpt-4o";
      const max_tokens = 2000;

      const htmlContent = await this.#llm.imageToText(
        image,
        prompt,
        model,
        systemPrompt,
        max_tokens,
      );

      if (htmlContent && htmlContent.length > 0) {
        this.#logger.debug("Got back ", htmlContent);
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
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} key - Storage key for logging
   * @returns {Promise<string[]>} Array of PNG image file paths (one per page)
   * @throws {Error} If pdftoppm fails or images cannot be generated
   */
  async #pdfSplitter(pdfBuffer, key) {
    // Create a temporary directory for images
    const tempDir = await mkdtemp(join(tmpdir(), "pdfsplit-"));
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

    // Collect all generated PNG files (page-1.png, page-2.png, ...)
    const files = await readdir(tempDir);
    const imageFiles = files
      .filter((f) => /^page-\d+\.png$/.test(f))
      .map((f) => join(tempDir, f));

    if (imageFiles.length === 0) {
      throw new Error("No images generated from PDF");
    }

    this.#logger.debug("Generated images from PDF", { key, imageFiles });

    return imageFiles;
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
