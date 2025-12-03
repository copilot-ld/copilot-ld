/* eslint-env node */

/**
 * Error thrown when parsing LLM response fails
 * Used by evaluators to signal retryable parsing failures
 */
export class ParseError extends Error {
  /**
   * Create a new ParseError
   * @param {string} message - Error message describing the parse failure
   * @param {object} [options] - Optional error options
   * @param {Error} [options.cause] - Original error that caused the parse failure
   */
  constructor(message, options) {
    super(message, options);
    this.name = "ParseError";
  }
}
