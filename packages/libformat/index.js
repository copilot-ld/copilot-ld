/* eslint-env node */
import { JSDOM } from "jsdom";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import DOMPurify from "dompurify";

import { FormatterInterface } from "./types.js";

/**
 * Formats markdown content to sanitized HTML
 */
export class HtmlFormatter extends FormatterInterface {
  /**
   * Creates an HTML formatter with required dependencies
   * @param {object} jsdom - JSDOM constructor for creating DOM window
   * @param {object} domPurify - DOMPurify sanitizer
   * @param {object} marked - Marked markdown parser
   */
  constructor(jsdom, domPurify, marked) {
    super();
    if (!jsdom) throw new Error("jsdom dependency is required");
    if (!domPurify) throw new Error("domPurify dependency is required");
    if (!marked) throw new Error("marked dependency is required");

    this.jsdom = jsdom;
    this.domPurify = domPurify;
    this.marked = marked;

    // Initialize the HTML marked instance with configuration
    this.htmlMarked = new this.marked.Marked().setOptions({
      breaks: true,
      gfm: true,
    });

    // Set up DOM window and purify
    this.window = new this.jsdom.JSDOM("").window;
    this.purify = this.domPurify(this.window);
  }

  /**
   * @inheritdoc
   * @returns {string} Sanitized HTML with allowed tags and attributes
   */
  format(markdown) {
    const rawHtml = this.htmlMarked.parse(markdown);
    return this.purify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
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
      ALLOWED_ATTR: ["href", "src", "alt", "title"],
      ALLOW_DATA_ATTR: false,
    });
  }
}

/**
 * Formats markdown content to terminal output with ANSI escape codes
 */
export class TerminalFormatter extends FormatterInterface {
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

    this.marked = marked;
    this.markedTerminal = markedTerminal;

    // Initialize the terminal marked instance with plugin
    this.terminalMarked = new this.marked.Marked().use(this.markedTerminal());
  }

  /**
   * @inheritdoc
   * @returns {string} Terminal-formatted text with ANSI escape codes
   */
  format(markdown) {
    return this.terminalMarked.parse(markdown);
  }
}

/**
 * Creates an HTML formatter with automatically injected dependencies
 * @returns {HtmlFormatter} Configured HTML formatter instance
 */
export function createHtmlFormatter() {
  return new HtmlFormatter({ JSDOM }, DOMPurify, { Marked });
}

/**
 * Creates a terminal formatter with automatically injected dependencies
 * @returns {TerminalFormatter} Configured terminal formatter instance
 */
export function createTerminalFormatter() {
  return new TerminalFormatter({ Marked }, markedTerminal);
}

export { FormatterInterface };
