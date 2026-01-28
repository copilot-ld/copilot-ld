import { spawn, spawnSync } from "child_process";
import { mkdtemp, writeFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { countTokens, ProcessorBase } from "@copilot-ld/libutil";
import { common } from "@copilot-ld/libtype";

/**
 * PdfTransformer converts PDF files in knowledge storage to HTML using Copilot vision.
 * Each PDF is split into images, each image is sent to Copilot for HTML conversion,
 * and all HTML fragments are merged into a single HTML document.
 */
export class PdfTransformer extends ProcessorBase {
  #knowledgeStorage;
  #llm;
  #logger;
  #promptLoader;
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
   * @param {import("@copilot-ld/libprompt").PromptLoader} promptLoader - Prompt loader for templates
   * @param {object} [options] - Optional configuration
   * @param {string} [options.systemPrompt] - System prompt for Copilot
   * @param {string} [options.userPrompt] - User prompt for Copilot
   * @param {string} [options.model] - Model name for Copilot
   * @param {number} [options.maxTokens] - Max tokens for Copilot response
   * @throws {Error} If pdftoppm is not available or promptLoader is not provided
   */
  constructor(knowledgeStorage, llm, logger, promptLoader, options = {}) {
    super(logger, 5);

    if (!knowledgeStorage) throw new Error("knowledgeStorage is required");
    if (!llm) throw new Error("llm is required");
    if (!logger) throw new Error("logger is required");
    if (!promptLoader) throw new Error("promptLoader is required");
    if (!this.#isPdftoppmAvailable()) {
      throw new Error("pdftoppm is not installed or not available in PATH");
    }

    this.#knowledgeStorage = knowledgeStorage;
    this.#llm = llm;
    this.#logger = logger;
    this.#promptLoader = promptLoader;

    if (options.imgToHtmlSystemPrompt) {
      this.#imgToHtmlSystemPrompt = options.systemPrompt;
    } else {
      this.#imgToHtmlSystemPrompt = this.#loadPrompt("image-to-html");
    }

    this.#annotateHtmlSystemPrompt = this.#loadPrompt("annotate-html");

    this.#contextExtractorSystemPrompt = this.#loadPrompt("context-extractor");

    this.#model = options.model || "gpt-4o";

    this.#maxTokens = options.maxTokens || 5000;
  }

  /**
   * Loads a prompt file using PromptLoader.
   * @param {string} promptName - Name of the prompt file (without extension)
   * @returns {string} Prompt file contents as a string
   * @throws {Error} If prompt file does not exist
   */
  #loadPrompt(promptName) {
    if (!promptName) {
      throw new Error("promptName must be supplied");
    }

    return this.#promptLoader.load(promptName);
  }

  /**
   * Converts all PDF files in knowledge storage to HTML and stores them.
   * @param {string} pdfExtension - File extension to filter by (default: ".pdf")
   * @param {string} htmlExtension - Output HTML extension (default: ".html")
   * @returns {Promise<void>}
   */
  async process(pdfExtension = ".pdf", htmlExtension = ".html") {
    const keys = await this.#knowledgeStorage.findByExtension(pdfExtension);

    this.#logger.debug("Processor", "Found PDF files to process", {
      count: keys.length,
    });
    for (const key of keys) {
      this.#logger.debug("Processor", "Processing PDF", { key });

      const pdfBuffer = await this.#knowledgeStorage.get(key);
      if (!Buffer.isBuffer(pdfBuffer)) {
        this.#logger.debug("Processor", "Skipping non-buffer PDF", { key });
        continue;
      }

      const html = await this.#pdfToHtml(pdfBuffer, key);

      const htmlKey = key.replace(/\.pdf$/i, htmlExtension);
      await this.#knowledgeStorage.put(htmlKey, html);

      this.#logger.debug("Processor", "Converted PDF to HTML", {
        key,
        html_key: htmlKey,
      });
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

      this.#logger.debug("Processor", "Split PDF into images", {
        key,
        count: images.length,
      });

      this.#logger.debug("Processor", "Using image to HTML system prompt", {
        prompt: this.#imgToHtmlSystemPrompt,
      });

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
      const contextDataString = await this.#contextExtraction(key, mergedHtml);

      const contextData = JSON.parse(contextDataString);

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
    this.#logger.debug("Processor", "Extracting context", { key });

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
    this.#logger.debug("Processor", "Token count of HTML", {
      token_count: countTokens(html),
    });
    this.#logger.debug("Processor", "Messages JSON", {
      messages: JSON.stringify(messages),
    });

    const response = await this.#llm.createCompletions(messages);

    if (response.choices && response.choices.length > 0) {
      this.#logger.debug("Processor", "Response received", {
        response: JSON.stringify(response),
      });
      // const htmlContent = response.choices[0].message.content?.text || "";
      const htmlContext = response.choices[0].message?.content || "";
      await this.#knowledgeStorage.put(key + "-context.json", htmlContext);
      this.#logger.debug("Processor", "Returning context", {
        context: htmlContext,
      });
      return htmlContext;
    } else {
      this.#logger.debug(
        "Processor",
        "Got an empty response from Copilot for HTML annotation",
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
      this.#logger.debug("Processor", "Messages JSON", {
        messages: JSON.stringify(messages),
      });

      const response = await this.#llm.createCompletions(messages);

      if (response.choices && response.choices.length > 0) {
        this.#logger.debug("Processor", "Response received", {
          response: JSON.stringify(response),
        });
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

    this.#logger.debug("Processor", "Created temp directory", {
      temp_dir: tempDir,
    });
    const pdfPath = join(tempDir, "input.pdf");
    await writeFile(pdfPath, pdfBuffer);
    this.#logger.debug("Processor", "Wrote PDF to file", { pdf_path: pdfPath });

    // pdftoppm command: pdftoppm input.pdf page -png
    const outputPrefix = join(tempDir, "page");
    this.#logger.debug("Processor", "Output prefix", {
      output_prefix: outputPrefix,
    });
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

    this.#logger.debug("Processor", "Generated images from PDF", {
      image_files: imageFiles.join(", "),
    });
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
