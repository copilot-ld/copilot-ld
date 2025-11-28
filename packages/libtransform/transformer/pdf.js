/* eslint-env node */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "node:url";
import { mkdtemp, writeFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { ProcessorBase } from "@copilot-ld/libutil";
import { common } from "@copilot-ld/libtype";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PdfTransformer converts PDF files in knowledge storage to HTML using Copilot vision.
 * Each PDF is split into images, each image is sent to Copilot for HTML conversion,
 * and all HTML fragments are merged into a single HTML document.
 */
export class PdfTransformer extends ProcessorBase {
  #knowledgeStorage;
  #llm;
  #logger;
  #imgToHtmlSystemPrompt;
  #annotateHtmlSystemPrompt;
  #contextExtractorSystemPrompt;
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

    if (options.imgToHtmlSystemPrompt) {
      this.#imgToHtmlSystemPrompt = options.systemPrompt;
    } else {
      this.#imgToHtmlSystemPrompt = this.#loadPrompt("image-to-html-prompt.md");
    }

    this.#annotateHtmlSystemPrompt = this.#loadPrompt(
      "annotate-html-prompt.md",
    );

    this.#contextExtractorSystemPrompt = this.#loadPrompt(
      "context-extractor-prompt.md",
    );

    this.#model = options.model || "gpt-4o";
    // this.#model = "gpt-5";
    // this.#model = "gpt-5-mini"; // no good
    // this.#model = "claude-haiku-4.5";
    // this.#model = "claude-sonnet-4.5"; //best?
    // this.#model = "gemini-2.5-pro"
    // this.#model = "gemini-3-pro-preview";
    // this.#model = "gemini-3-pro";

    this.#maxTokens = options.maxTokens || 5000;
  }

  /**
   * Loads a prompt file by name from the current directory.
   * Checks if the file exists before reading.
   * @param {string} promptName - Name of the prompt file to load
   * @returns {string} Prompt file contents as a string
   * @throws {Error} If promptName is not supplied or file does not exist
   */
  #loadPrompt(promptName) {
    if (!promptName) {
      throw new Error("promptName must be supplied");
    }

    const promptPath = join(__dirname, promptName);

    if (!existsSync(promptPath)) {
      throw new Error(`Prompt file does not exist: ${promptPath}`);
    }

    return readFileSync(promptPath, { encoding: "utf-8" });
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
      this.#logger.debug(`Processing PDF ${key}`);

      const pdfBuffer = await this.#knowledgeStorage.get(key);
      if (!Buffer.isBuffer(pdfBuffer)) {
        this.#logger.debug(`Skipping non-buffer PDF ${key}`);
        continue;
      }

      const html = await this.#pdfToHtml(pdfBuffer, key);

      const htmlKey = key.replace(/\.pdf$/i, htmlExtension);
      await this.#knowledgeStorage.put(htmlKey, html);

      this.#logger.debug(`Converted PDF ${key} to HTML ${htmlKey}`);
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
    const tempDir = await mkdtemp(join(tmpdir(), "pdfsplit-"));
    try {
      const images = await this.#pdfSplitter(pdfBuffer, tempDir);

      this.#logger.debug(`Split PDF ${key} into images ${images.length}`);

      this.#logger.debug(
        `this.#imgToHtmlSystemPrompt ${this.#imgToHtmlSystemPrompt} `,
      );

      const htmlFragments = [];

      for (const [i, image] of images.entries()) {
        // if (i === 2) {
        //   this.#logger.debug(
        //     `Reached max 3 pages for PDF ${key}, stopping further processing.`,
        //   );
        //   break;
        // }

        this.#logger.debug(`Sending image ${i + 1} to Copilot - ${image}`);

        const htmlContent = await this.#llm.imageToText(
          image,
          `This is the image of page ${i + 1}. Convert it to HTML.`,
          this.#model,
          this.#imgToHtmlSystemPrompt,
          this.#maxTokens,
        );

        if (htmlContent && htmlContent.length > 0) {
          this.#logger.debug(
            `Received HTML from Copilot, page: ${i + 1}, contentLength: ${htmlContent.length}`,
          );
          htmlFragments.push(htmlContent);
        } else {
          this.#logger.debug(
            `Got an empty response from Copilot for image, page: ${i + 1} `,
          );
        }
      }

      const mergedHtml = [
        "<!DOCTYPE html>",
        "<html>",
        `<head><meta charset="utf-8"><title>${key}</title></head>`,
        `<body>`,
        `<h1>${key} </h1>`,
        ...htmlFragments,
        "</body>",
        "</html>",
      ].join("\n");

      // this.#logger.debug(`Merged HTML ${htmlFragments.length} fragments`);

      await this.#knowledgeStorage.put(key + "-merged.html", mergedHtml);

      // this.#logger.debug(`Merged HTML ${mergedHtml}`);
      // this.#logger.debug(`Merged HTML ${typeof mergedHtml}`);
      const contextDataStrign = await this.#contextExtraction(key, mergedHtml);

      const contextData = JSON.parse(contextDataStrign);

      const annotatedHtml = this.#annotateHtml(key, htmlFragments, contextData);
      return annotatedHtml;
    } finally {
      // Clean up tempDir after all processing is complete
      this.#logger.debug(`Removing tempDir ${tempDir}`);
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Analyze the provided HTML presentation document and
   * generate a structured JSON summary that describes the
   * global context and the specific content of every single slide.
   * @param {string} key - Storage key for logging
   * @param {string} html - html document to extract context from
   * @returns {Promise<string>} JSON summary
   */
  async #contextExtraction(key, html) {
    this.#logger.debug(`Extracting context`);

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
    this.#logger.debug(`token count of html ${this.#llm.countTokens(html)}`);
    this.#logger.debug(`json ${JSON.stringify(messages)}`);

    const response = await this.#llm.createCompletions(messages);

    if (response.choices && response.choices.length > 0) {
      this.#logger.debug(`response ${JSON.stringify(response)}`);
      // const htmlContent = response.choices[0].message.content?.text || "";
      const htmlContext = response.choices[0].message?.content || "";
      await this.#knowledgeStorage.put(key + "-context.json", htmlContext);
      // this.#logger.debug(`htmlCohtmlContextntent ${htmlContext}`);
      this.#logger.debug(`Returning context ${htmlContext}`);
      return htmlContext;
    } else {
      this.#logger.debug(
        `Got an empty response from Copilot for HTML annotation"`,
      );
      throw new Error("Got an empty response from Copilot for HTML annotation");
    }
  }

  /**
   * Inject Schema.org structured data into a the HTML
   * @param {string} key - Storage key for logging
   * @param {string} htmlFragments - list containing html fragments
   * @param {string} contextData - structured JSON summary that describes the
   * global context of the HTML
   * @returns {Promise<string>} annotated HTML
   */
  async #annotateHtml(key, htmlFragments, contextData) {
    const annotatedHtml = [];

    for (const [i, htmlFragment] of htmlFragments.entries()) {
      const populatedAnnotateHtmlSystemPrompt = this.#annotateHtmlSystemPrompt
        .replace("{global_summary}", contextData.global_summary)
        .replace("{document_type}", contextData.document_type)
        .replace("{slide_summary}", contextData.slides[i + 1]);

      const messages = [
        common.Message.fromObject({
          role: "system",
          content: populatedAnnotateHtmlSystemPrompt,
        }),
        common.Message.fromObject({
          role: "user",
          content: htmlFragment,
        }),
      ];
      this.#logger.debug(`json ${JSON.stringify(messages)}`);

      const response = await this.#llm.createCompletions(messages);

      if (response.choices && response.choices.length > 0) {
        this.#logger.debug(`response ${JSON.stringify(response)}`);
        // const htmlContent = response.choices[0].message.content?.text || "";
        annotatedHtml.push(response.choices[0].message?.content);
      } else {
        throw new Error(
          `Got an empty response from Copilot for HTML annotation of page: ${i + 1}`,
        );
      }
    }

    const mergedHtml = [
      "<!DOCTYPE html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${key}</title></head>`,
      `<body>`,
      `<h1>${key} </h1>`,
      ...annotatedHtml,
      "</body>",
      "</html>",
    ].join("\n");

    return mergedHtml;
  }
  /**
   * Splits a PDF buffer into an array of image file paths using pdftoppm.
   * Returns both the image file paths and the temp directory for later cleanup.
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} tempDir - location to store temporary image files
   * @returns {Promise<string[]>} Array of image file paths
   * @throws {Error} If pdftoppm fails or images cannot be generated
   */
  async #pdfSplitter(pdfBuffer, tempDir) {
    // Create a temporary directory for images

    this.#logger.debug(`Created temp directory ${tempDir} `);
    const pdfPath = join(tempDir, "input.pdf");
    await writeFile(pdfPath, pdfBuffer);
    this.#logger.debug(`Wrote pdf to  ${pdfPath} `);

    // pdftoppm command: pdftoppm input.pdf page -png
    const outputPrefix = join(tempDir, "page");
    this.#logger.debug(`outputPrefix  ${outputPrefix} `);
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

    this.#logger.debug(`Generated images from PDF - ${imageFiles}`);
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
