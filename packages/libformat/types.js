/* eslint-env node */

/**
 * Interface for formatting markdown content to different output formats
 */
export class FormatterInterface {
  /**
   * Formats markdown content to the target format
   * @param {string} markdown - Markdown content to format
   * @throws {Error} Not implemented
   */
  format(markdown) {
    throw new Error("Not implemented");
  }
}
