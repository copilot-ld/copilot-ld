/* eslint-env node */

/**
 * Interface for REPL implementations
 */
export class ReplInterface {
  /**
   * Creates a REPL instance with injected dependencies
   * @param {object} readline - Readline module for creating interfaces
   * @param {object} process - Process object for stdin/stdout and exit
   * @param {object} formatter - Formatter instance for output formatting
   * @param {object} handlers - REPL configuration and handlers
   */
  constructor(readline, process, formatter, handlers = {}) {
    // Interface constructor - no implementation required
  }

  /**
   * Starts the REPL in either interactive or non-interactive mode
   * @throws {Error} Not implemented
   */
  async start() {
    throw new Error("Not implemented");
  }

  /**
   * Shows help message with all available commands
   * @param {object} customCommands - Additional custom commands to include
   * @throws {Error} Not implemented
   */
  showHelp(customCommands = {}) {
    throw new Error("Not implemented");
  }

  /**
   * Creates a state variable command that gets/sets a value
   * @param {string} name - Variable name
   * @param {any} initialValue - Initial value
   * @param {string} description - Brief description for help
   * @throws {Error} Not implemented
   */
  createStateCommand(name, initialValue, description) {
    throw new Error("Not implemented");
  }
}
