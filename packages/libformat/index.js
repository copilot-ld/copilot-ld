/* eslint-env node */
// External libraries (alphabetical)
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import sanitizeHtml from "sanitize-html";

/**
 * @typedef {object} FormatterInterface
 * @property {function(string): string} format - Formats markdown content to the target format
 */

/**
 * Formats markdown content to sanitized HTML
 * @implements {FormatterInterface}
 */
export class HtmlFormatter {
  #sanitizeHtml;
  #marked;
  #htmlMarked;

  /**
   * Creates an HTML formatter with required dependencies
   * @param {object} sanitizeHtml - sanitize-html sanitizer
   * @param {object} marked - Marked markdown parser
   */
  constructor(sanitizeHtml, marked) {
    if (!sanitizeHtml) throw new Error("sanitizeHtml dependency is required");
    if (!marked) throw new Error("marked dependency is required");

    this.#sanitizeHtml = sanitizeHtml;
    this.#marked = marked;

    // Initialize the HTML marked instance with configuration
    this.#htmlMarked = new this.#marked.Marked().setOptions({
      breaks: true,
      gfm: true,
    });
  }

  /**
   * Formats markdown content to the target format
   * @param {string} markdown - Markdown content to format
   * @returns {string} Sanitized HTML with allowed tags and attributes
   */
  format(markdown) {
    const rawHtml = this.#htmlMarked.parse(markdown);
    return this.#sanitizeHtml(rawHtml, {
      allowedTags: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ],
      allowedAttributes: {
        a: ["href", "title"],
        img: ["src", "alt", "title"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });
  }
}

/**
 * Formats markdown content to terminal output with ANSI escape codes
 * @implements {FormatterInterface}
 */
export class TerminalFormatter {
  #marked;
  #markedTerminal;
  #terminalMarked;

  /**
   * Creates a terminal formatter with required dependencies
   * @param {object} marked - Marked markdown parser
   * @param {object} markedTerminal - marked-terminal plugin
   */
  constructor(marked, markedTerminal) {
    if (!marked) throw new Error("marked dependency is required");
    if (!markedTerminal)
      throw new Error("markedTerminal dependency is required");

    this.#marked = marked;
    this.#markedTerminal = markedTerminal;

    // Initialize the terminal marked instance with plugin
    // Pass showErrors: false to suppress warnings about unknown languages
    this.#terminalMarked = new this.#marked.Marked()
      .use(this.#markedTerminal({ showErrors: false }))
      .setOptions({
        silent: true,
      });
  }

  /**
   * Formats markdown content to the target format
   * @param {string} markdown - Markdown content to format
   * @returns {string} Terminal-formatted text with ANSI escape codes
   */
  format(markdown) {
    return this.#terminalMarked.parse(markdown);
  }
}

/**
 * Creates an HTML formatter with automatically injected dependencies
 * @returns {HtmlFormatter} Configured HTML formatter instance
 */
export function createHtmlFormatter() {
  return new HtmlFormatter(sanitizeHtml, { Marked: Marked });
}

/**
 * Creates a terminal formatter with automatically injected dependencies
 * @returns {TerminalFormatter} Configured terminal formatter instance
 */
export function createTerminalFormatter() {
  return new TerminalFormatter({ Marked: Marked }, markedTerminal);
}
