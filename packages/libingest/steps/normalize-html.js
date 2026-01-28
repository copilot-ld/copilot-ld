import { STEP_NAME as ANNOTATE_HTML_STEP } from "./annotate-html.js";
import { StepBase } from "./step-base.js";

export const STEP_NAME = "normalize-html";

/**
 * NormalizeHtml step: Normalizes HTML for consistent comparison.
 *
 * Workflow:
 * - Loads annotated HTML from storage (from annotate-html step)
 * - Parses and normalizes the HTML structure
 * - Saves normalized HTML as the final pipeline output
 * - Updates ingest context with output key and pipeline metadata
 */
export class NormalizeHtml extends StepBase {
  /**
   * Create a new NormalizeHtml instance.
   * @param {import("@copilot-ld/libstorage").StorageInterface} ingestStorage Storage backend for ingest files
   * @param {object} logger Logger instance with debug() method
   * @param {import("./step-base.js").ModelConfig} modelConfig Model configuration
   * @param {import("@copilot-ld/libconfig").Config} config Config instance for environment access
   */
  constructor(ingestStorage, logger, modelConfig, config) {
    super(ingestStorage, logger, modelConfig, config);
  }

  /**
   * Normalizes HTML and updates ingest context.
   * @param {string} ingestContextKey Key for the ingest context in storage
   * @returns {Promise<void>} Resolves when processing is complete
   */
  async process(ingestContextKey) {
    const ingestContext = await this.loadIngestContext(ingestContextKey);
    const step = this.getStep(ingestContext, STEP_NAME, ingestContextKey);
    const targetDir = this.getTargetDir(ingestContextKey);

    // Get annotated HTML key from previous step
    const annotatedHtmlKey = this.getPreviousStepData(
      ingestContext,
      ANNOTATE_HTML_STEP,
      "annotatedHtmlKey",
      ingestContextKey,
    );

    this.logger.debug(`Normalizing HTML from: ${annotatedHtmlKey}`);

    // Load annotated HTML
    const html = String(await this.ingestStorage.get(annotatedHtmlKey));

    // Normalize HTML
    const normalizedHtml = this.#normalizeHtml(html);

    // Save normalized HTML as final output
    const outputKey = `${targetDir}/output.html`;
    await this.ingestStorage.put(outputKey, normalizedHtml);
    this.logger.debug(`Saved final output to ${outputKey}`);

    // Update pipeline metadata with output pointer
    ingestContext.pipeline = {
      output: "output.html",
      outputMimeType: "text/html",
    };

    await this.completeStep(ingestContextKey, ingestContext, step, {
      outputKey,
    });
  }

  /**
   * Normalizes HTML for consistent comparison.
   * @param {string} html Raw HTML string
   * @returns {string} Normalized HTML string
   */
  #normalizeHtml(html) {
    // Remove markdown code block wrappers if present
    let normalized = html
      .replace(/^```html\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    // Normalize line endings
    normalized = normalized.replace(/\r\n/g, "\n");

    // Remove excessive blank lines (more than 1 consecutive)
    normalized = normalized.replace(/\n{3,}/g, "\n\n");

    // Normalize whitespace in tags (but preserve content)
    normalized = this.#normalizeTagWhitespace(normalized);

    // Sort attributes alphabetically within tags
    normalized = this.#sortAttributes(normalized);

    // Ensure consistent indentation (2 spaces)
    normalized = this.#normalizeIndentation(normalized);

    return normalized;
  }

  /**
   * Normalizes whitespace within HTML tags.
   * @param {string} html HTML string
   * @returns {string} HTML with normalized tag whitespace
   */
  #normalizeTagWhitespace(html) {
    // Normalize multiple spaces/newlines within opening tags to single space
    return html.replace(
      /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\s*>/g,
      (match, tagName, attrs) => {
        if (!attrs) return `<${tagName}>`;
        // Normalize whitespace in attributes
        const normalizedAttrs = attrs.replace(/\s+/g, " ").trim();
        return `<${tagName} ${normalizedAttrs}>`;
      },
    );
  }

  /**
   * Sorts attributes alphabetically within HTML tags.
   * @param {string} html HTML string
   * @returns {string} HTML with sorted attributes
   */
  #sortAttributes(html) {
    // Match opening tags with attributes
    return html.replace(
      /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]+)>/g,
      (match, tagName, attrsString) => {
        // Parse attributes - handle quoted values
        const attrRegex =
          /([a-zA-Z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        const attrs = [];
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
          const name = attrMatch[1];
          const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? null;
          attrs.push({ name, value });
        }

        // Sort alphabetically by attribute name
        attrs.sort((a, b) => a.name.localeCompare(b.name));

        // Rebuild attributes string
        const sortedAttrs = attrs
          .map(({ name, value }) =>
            value !== null ? `${name}="${value}"` : name,
          )
          .join(" ");

        return `<${tagName} ${sortedAttrs}>`;
      },
    );
  }

  /**
   * Normalizes indentation to consistent 2-space indent.
   * @param {string} html HTML string
   * @returns {string} HTML with normalized indentation
   */
  #normalizeIndentation(html) {
    const lines = html.split("\n");
    const result = [];
    let indentLevel = 0;

    // Tags that don't increase indent for their content
    const voidTags = new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ]);

    // Tags that should be on their own line
    const blockTags = new Set([
      "html",
      "head",
      "body",
      "div",
      "section",
      "article",
      "header",
      "footer",
      "nav",
      "main",
      "aside",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "blockquote",
      "pre",
      "form",
      "fieldset",
    ]);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for closing tags at start
      const closingMatch = trimmed.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)>/);
      if (closingMatch && blockTags.has(closingMatch[1].toLowerCase())) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add line with current indent
      result.push("  ".repeat(indentLevel) + trimmed);

      // Check for opening tags (not self-closing, not void)
      const openingMatch = trimmed.match(
        /^<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/)>$/,
      );
      if (openingMatch) {
        const tagName = openingMatch[1].toLowerCase();
        if (blockTags.has(tagName) && !voidTags.has(tagName)) {
          // Check if same line has closing tag
          const hasClosing = trimmed.includes(`</${openingMatch[1]}`);
          if (!hasClosing) {
            indentLevel++;
          }
        }
      }

      // Handle self-contained tags with content on same line
      if (trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)[^>]*>.*<\/\1>$/)) {
        // Tag opens and closes on same line - no indent change
      }
    }

    return result.join("\n");
  }
}
