import { spawn, spawnSync } from "child_process";
import { mkdtemp, writeFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "pdf-to-images";

const PDF_SPLIT_PREFIX = "pdfsplit-";

/**
 * Checks if pdftoppm command is available on the system.
 * @returns {boolean} True if pdftoppm is available, false otherwise
 */
function isPdftoppmAvailable() {
  const result = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
  return result.status === 0 || Boolean(result.stdout?.includes("pdftoppm"));
}

/**
 * PdfToImages step: Converts PDF files to images and uploads them to storage.
 *
 * Workflow:
 * - Loads PDF from storage
 * - Splits PDF into images using pdftoppm
 * - Uploads images to storage
 * - Updates ingest context with image keys
 */
export class PdfToImages extends StepBase {
  /**
   * Create a new PdfToImages instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {import("./step-base.js").ModelConfig} modelConfig Model configuration
   * @param {import("@copilot-ld/libconfig").Config} config Config instance for environment access
   * @param {import("@copilot-ld/libprompt").PromptLoader} promptLoader Prompt loader for templates
   */
  constructor(ingestStorage, logger, modelConfig, config, promptLoader) {
    super(ingestStorage, logger, modelConfig, config, promptLoader);
    if (!isPdftoppmAvailable()) {
      throw new Error("pdftoppm is not installed or not available in PATH");
    }
  }

  /**
   * Converts a PDF file in storage to images and updates ingest context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(ingestContextKey) {
    const ingestContext = await this.loadIngestContext(ingestContextKey);
    const step = this.getStep(ingestContext, STEP_NAME, ingestContextKey);
    const targetDir = this.getTargetDir(ingestContextKey);

    // Ensure the file is a PDF
    if (ingestContext.mime !== "application/pdf") {
      throw new Error(`File is not a PDF: ${ingestContextKey}`);
    }

    // Get the file key and filename from context
    const pdfKey = join(targetDir, "target" + ingestContext.extension);

    this.logger.debug(`Processing PDF ${pdfKey}`);

    const pdfBuffer = await this.ingestStorage.get(pdfKey);
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error(`Got a non-buffer PDF ${pdfKey}`);
    }

    const tempDir = await mkdtemp(join(tmpdir(), PDF_SPLIT_PREFIX));
    try {
      const images = await this.#pdfSplitter(pdfBuffer, tempDir);

      this.logger.debug("PdfToImages", "Split PDF into images", {
        key: pdfKey,
        count: images.length,
      });
      const savedImageKeys = [];
      for (const imagePath of images) {
        // Read image file as buffer
        const imageBuffer = await readFile(imagePath);
        const pageMatch = imagePath.match(/page-(\d+)\.png$/);
        const pageNum = pageMatch ? pageMatch[1] : "unknown";
        const imageKey = `${targetDir}/target-page-${pageNum}.png`;
        await this.ingestStorage.put(imageKey, imageBuffer);

        this.logger.debug("PdfToImages", "Uploaded image", { key: imageKey });
        savedImageKeys.push(imageKey);
      }

      await this.completeStep(ingestContextKey, ingestContext, step, {
        imageKeys: savedImageKeys,
      });
    } finally {
      // Clean up tempDir after all processing is complete
      this.logger.debug("PdfToImages", "Removing temp directory", {
        temp_dir: tempDir,
      });
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Split a PDF buffer into PNG images using pdftoppm.
   * @param {Buffer} pdfBuffer PDF file buffer
   * @param {string} tempDir Temporary directory for image files
   * @returns {Promise<string[]>} Array of image file paths
   * @throws {Error} If pdftoppm fails or no images are generated
   */
  async #pdfSplitter(pdfBuffer, tempDir) {
    const pdfPath = join(tempDir, "input.pdf");
    await writeFile(pdfPath, pdfBuffer);
    this.logger.debug(`Wrote pdf to ${pdfPath}`);

    // pdftoppm command: pdftoppm input.pdf page -png
    const outputPrefix = join(tempDir, "page");
    this.logger.debug(`outputPrefix ${outputPrefix}`);
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

    this.logger.debug("PdfToImages", "Generated images from PDF", {
      image_files: imageFiles.join(", "),
    });
    return imageFiles;
  }
}
