import { common } from "@copilot-ld/libtype";
import { Utils } from "../utils.js";
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
   * @param {import("./step-base.js").ModelConfig} [modelConfig] Optional model configuration
   */
  constructor(ingestStorage, logger, modelConfig) {
    super(ingestStorage, logger, modelConfig);

    this.#annotateHtmlSystemPrompt = Utils.loadPrompt(
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
    const llm = this.createLlm();

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

    this._logger.debug("AnnotateHtml", "Annotating fragments with context", {
      fragment_count: fragmentKeys.length,
      context_key: contextKey,
    });

    // Load fragments and context from storage
    const htmlFragments = await this.#loadFragments(fragmentKeys);
    const contextData = await this._ingestStorage.get(contextKey);

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
      const content = String(await this._ingestStorage.get(key));
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
      this._logger.debug("AnnotateHtml", "Annotating fragment", {
        fragment: i + 1,
      });

      const pageKey = `page-${i + 1}`;
      const slideData = contextData.slides?.[pageKey] || {};
      const slideContext =
        typeof slideData === "string" ? slideData : slideData.summary || "";

      const populatedPrompt = this.#annotateHtmlSystemPrompt
        .replace("{global_summary}", contextData.global_summary || "")
        .replace("{document_type}", contextData.document_type || "")
        .replace("{entities}", entitiesList)
        .replace("{slide_summary}", slideContext);

      const messages = [
        common.Message.fromObject({
          role: "system",
          content: populatedPrompt,
        }),
        common.Message.fromObject({
          role: "user",
          content: htmlFragment,
        }),
      ];

      const response = await llm.createCompletions(
        messages,
        undefined,
        undefined,
        this.getMaxTokens(),
      );

      if (!response.choices || response.choices.length === 0) {
        throw new Error(
          `Got an empty response from Copilot for HTML annotation of fragment: ${i + 1}`,
        );
      }

      const annotatedHtml = response.choices[0].message?.content || "";
      annotatedFragments.push(annotatedHtml);
      this._logger.debug("AnnotateHtml", "Annotated fragment", {
        fragment: i + 1,
        length: annotatedHtml.length,
      });
    }

    return annotatedFragments;
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
    await this._ingestStorage.put(annotatedHtmlKey, mergedHtml);
    this._logger.debug("AnnotateHtml", "Saved annotated HTML", {
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
