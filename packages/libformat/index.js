/* eslint-env node */
// External libraries (alphabetical)
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import sanitizeHtml from "sanitize-html";

/**
 * Base interface for formatter implementations
 */
export class FormatterInterface {
  /**
   * Formats markdown content to the target format
   * @param {string} _markdown - Markdown content to format
   * @returns {string} Formatted output
   */
  format(_markdown) {
    return "";
  }
}

/**
 * Formats markdown content to sanitized HTML
 */
export class HtmlFormatter extends FormatterInterface {
  #sanitizeHtml;
  #marked;
  #htmlMarked;

  /**
   * Creates an HTML formatter with required dependencies
   * @param {object} sanitizeHtml - sanitize-html sanitizer
   * @param {object} marked - Marked markdown parser
   */
  constructor(sanitizeHtml, marked) {
    super();
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
 */
export class TerminalFormatter extends FormatterInterface {
  #marked;
  #markedTerminal;
  #terminalMarked;

  /**
   * Creates a terminal formatter with required dependencies
   * @param {object} marked - Marked markdown parser
   * @param {object} markedTerminal - marked-terminal plugin
   */
  constructor(marked, markedTerminal) {
    super();
    if (!marked) throw new Error("marked dependency is required");
    if (!markedTerminal)
      throw new Error("markedTerminal dependency is required");

    this.#marked = marked;
    this.#markedTerminal = markedTerminal;

    // Initialize the terminal marked instance with plugin
    this.#terminalMarked = new this.#marked.Marked().use(
      this.#markedTerminal(),
    );
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
