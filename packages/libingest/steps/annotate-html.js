import { common } from "@copilot-ld/libtype";
import { STEP_NAME as IMAGES_TO_HTML_STEP } from "./images-to-html.js";
import { STEP_NAME as EXTRACT_CONTEXT_STEP } from "./extract-context.js";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "annotate-html";

/**
 * AnnotateHtml step: Injects Schema.org structured data into HTML.
 *
 * Workflow:
 * - Loads HTML from storage (from images-to-html step)
 * - Loads document context (from extract-context step)
 * - Annotates each HTML fragment with Schema.org microdata
 * - Stores the annotated HTML document
 * - Updates ingest context with annotated HTML key
 */
export class AnnotateHtml extends StepBase {
  #annotateHtmlSystemPrompt;

  /**
   * Create a new AnnotateHtml instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {import("./step-base.js").ModelConfig} modelConfig Model configuration
   * @param {import("@copilot-ld/libconfig").Config} config Config instance for environment access
   */
  constructor(ingestStorage, logger, modelConfig, config) {
    super(ingestStorage, logger, modelConfig, config);

    this.#annotateHtmlSystemPrompt = this.loadPrompt(
      "annotate-html-prompt.md",
      import.meta.dirname,
    );
  }

  /**
   * Annotates HTML with Schema.org structured data and updates ingest context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(ingestContextKey) {
    const ingestContext = await this.loadIngestContext(ingestContextKey);
    const step = this.getStep(ingestContext, STEP_NAME, ingestContextKey);
    const targetDir = this.getTargetDir(ingestContextKey);

    // Get keys from previous steps
    const fragmentKeys = this.getPreviousStepData(
      ingestContext,
      IMAGES_TO_HTML_STEP,
      "fragmentKeys",
      ingestContextKey,
    );
    const contextKey = this.getPreviousStepData(
      ingestContext,
      EXTRACT_CONTEXT_STEP,
      "contextKey",
      ingestContextKey,
    );

    // Create LLM after validation
    const llm = await this.createLlm();

    this.logger.debug("AnnotateHtml", "Annotating fragments with context", {
      fragment_count: fragmentKeys.length,
      context_key: contextKey,
    });

    // Load fragments and context from storage
    const htmlFragments = await this.#loadFragments(fragmentKeys);
    const contextData = await this.ingestStorage.get(contextKey);

    // Annotate HTML fragments
    const annotatedFragments = await this.#annotateFragments(
      llm,
      htmlFragments,
      contextData,
    );

    // Save annotated HTML
    const annotatedHtmlKey = await this.#saveAnnotatedHtml(
      targetDir,
      annotatedFragments,
      ingestContext.filename,
    );

    await this.completeStep(ingestContextKey, ingestContext, step, {
      annotatedHtmlKey,
      fragmentCount: annotatedFragments.length,
    });
  }

  /**
   * Loads HTML fragments from storage
   * @param {string[]} fragmentKeys Array of fragment storage keys
   * @returns {Promise<string[]>} Array of HTML fragment contents
   */
  async #loadFragments(fragmentKeys) {
    const fragments = [];
    for (const key of fragmentKeys) {
      const content = String(await this.ingestStorage.get(key));
      fragments.push(content);
    }
    return fragments;
  }

  /**
   * Annotates HTML fragments using LLM
   * @param {object} llm LLM client instance
   * @param {string[]} htmlFragments Array of HTML fragments to annotate
   * @param {object} contextData Document context data
   * @returns {Promise<string[]>} Array of annotated HTML fragments
   */
  async #annotateFragments(llm, htmlFragments, contextData) {
    const annotatedFragments = [];

    // Format entities for prompt
    const entitiesList = this.#formatEntities(contextData.entities);

    for (const [i, htmlFragment] of htmlFragments.entries()) {
      this.logger.debug("AnnotateHtml", "Annotating fragment", {
        fragment: i + 1,
      });

      const pageContext = this.#getPageContext(contextData, i + 1);
      const populatedPrompt = this.#annotateHtmlSystemPrompt
        .replace("{global_summary}", contextData.global_summary || "")
        .replace("{document_type}", contextData.document_type || "")
        .replace("{entities}", entitiesList)
        .replace("{page_summary}", pageContext);

      const annotatedHtml = await this.#annotateFragment(
        llm,
        htmlFragment,
        populatedPrompt,
        i + 1,
      );
      annotatedFragments.push(annotatedHtml);
      this.logger.debug("AnnotateHtml", "Annotated fragment", {
        fragment: i + 1,
        length: annotatedHtml.length,
      });
    }

    return annotatedFragments;
  }

  /**
   * Gets page context from document context data
   * @param {object} contextData Document context data
   * @param {number} pageNum Page number (1-based)
   * @returns {string} Page context summary
   */
  #getPageContext(contextData, pageNum) {
    const pageKey = `page-${pageNum}`;
    // Support both 'pages' (new) and 'slides' (legacy) keys
    const pageData =
      contextData.pages?.[pageKey] || contextData.slides?.[pageKey] || {};
    return typeof pageData === "string" ? pageData : pageData.summary || "";
  }

  /**
   * Annotates a single HTML fragment using LLM
   * @param {object} llm LLM client instance
   * @param {string} htmlFragment HTML fragment to annotate
   * @param {string} systemPrompt Populated system prompt
   * @param {number} fragmentNum Fragment number for error messages
   * @returns {Promise<string>} Annotated HTML
   */
  async #annotateFragment(llm, htmlFragment, systemPrompt, fragmentNum) {
    const messages = [
      common.Message.fromObject({
        role: "system",
        content: systemPrompt,
      }),
      common.Message.fromObject({
        role: "user",
        content: htmlFragment,
      }),
    ];

    const response = await llm.createCompletions({
      messages,
      max_tokens: this.getMaxTokens(),
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error(
        `Got an empty response from Copilot for HTML annotation of fragment: ${fragmentNum}`,
      );
    }

    return response.choices[0].message?.content || "";
  }

  /**
   * Saves annotated HTML to storage
   * @param {string} targetDir Target directory path
   * @param {string[]} annotatedFragments Array of annotated HTML fragments
   * @param {string} filename Original filename for the title
   * @returns {Promise<string>} Storage key for the annotated HTML
   */
  async #saveAnnotatedHtml(targetDir, annotatedFragments, filename) {
    const mergedHtml = [
      "<!DOCTYPE html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${filename}</title></head>`,
      "<body>",
      ...annotatedFragments,
      "</body>",
      "</html>",
    ].join("\n");

    const annotatedHtmlKey = `${targetDir}/annotated.html`;
    await this.ingestStorage.put(annotatedHtmlKey, mergedHtml);
    this.logger.debug("AnnotateHtml", "Saved annotated HTML", {
      key: annotatedHtmlKey,
    });

    return annotatedHtmlKey;
  }

  /**
   * Formats entities object into a readable string for the prompt
   * @param {object} entities Entities object with organizations, products, projects
   * @returns {string} Formatted entities string
   */
  #formatEntities(entities) {
    if (!entities) return "None identified";

    const parts = [];
    if (entities.organizations?.length > 0) {
      parts.push(`Organizations: ${entities.organizations.join(", ")}`);
    }
    if (entities.products?.length > 0) {
      parts.push(`Products: ${entities.products.join(", ")}`);
    }
    if (entities.projects?.length > 0) {
      parts.push(`Projects: ${entities.projects.join(", ")}`);
    }

    return parts.length > 0 ? parts.join("; ") : "None identified";
  }
}
