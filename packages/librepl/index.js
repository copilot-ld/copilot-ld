/* eslint-env node */
import readline from "readline";

/**
 * Simple REPL with dependency injection
 */
export class Repl {
  #readline;
  #process;
  #formatter;
  #config;
  #rl;

  /**
   * Creates a REPL instance with injected dependencies
   * @param {import("@copilot-ld/libformat").FormatterInterface} formatter - Formatter instance for output formatting
   * @param {object} config - REPL configuration
   * @param {string} config.prompt - Prompt string
   * @param {Function} config.onLine - Handler for input lines
   * @param {Function} config.setup - Setup function to run before starting
   * @param {{[key: string]: Function}} config.commands - Custom command handlers
   * @param {string} config.help - Static help text to show before command list
   * @param {{[key: string]: any}} config.state - State variables that can be set via command line args
   * @param {object} readlineModule - Readline module for creating interfaces
   * @param {object} processObj - Process object for stdin/stdout and exit
   */
  constructor(
    formatter,
    config = {},
    readlineModule = readline,
    processObj = process,
  ) {
    if (!formatter) throw new Error("formatter dependency is required");

    this.#formatter = formatter;
    this.#readline = readlineModule;
    this.#process = processObj;

    this.#formatter = formatter;
    this.#readline = readline;
    this.#process = process;
    this.#config = {
      prompt: "> ",
      onLine: null,
      setup: null,
      commands: {},
      state: {},
      ...config,
    };
    this.#rl = null;

    // Initialize state from config and parse command line arguments
    this.state = { ...this.#config.state };
    this.#parseCommandLineArgs();
  }

  /**
   * Parses command line arguments to override state values
   */
  #parseCommandLineArgs() {
    const args = this.#process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--") && i + 1 < args.length) {
        const stateName = arg.slice(2);
        const value = args[i + 1];

        if (Object.prototype.hasOwnProperty.call(this.state, stateName)) {
          // Try to parse as number if it looks like one
          if (/^\d+$/.test(value)) {
            this.state[stateName] = parseInt(value);
          } else if (/^\d*\.\d+$/.test(value)) {
            this.state[stateName] = parseFloat(value);
          } else {
            this.state[stateName] = value;
          }
          i++; // Skip the value argument
        }
      }
    }
  }

  /**
   * Formats and writes output to stdout
   * @param {string} text - Text to output
   * @returns {Promise<void>} Promise that resolves when output is complete
   */
  async #output(text) {
    if (text !== undefined && text !== null) {
      const formatted = "\n" + this.#formatter.format(text).trim() + "\n";
      return new Promise((resolve) => {
        this.#process.stdout.write(formatted, () => {
          // Add a small delay to ensure the output is visually complete
          setTimeout(resolve, 10);
        });
      });
    }
  }

  /**
   * Handles a single line of input
   * @param {string} line - Input line to process
   * @returns {Promise<void>}
   */
  async #handleLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Handle commands
    if (trimmed.startsWith("/")) {
      const parts = trimmed.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Built-in commands
      if (command === "help") {
        await this.#showHelp();
        return;
      }
      if (command === "exit") {
        this.#process.exit(0);
      }

      // Custom commands
      const handler = this.#config.commands[command];
      if (handler) {
        try {
          const result = await handler(args, this.state);
          await this.#output(result);
        } catch (error) {
          this.#process.stderr.write(`Error: ${error.message}\n`);
        }
      } else {
        await this.#showHelp();
      }
      return;
    }

    // Handle regular input
    if (this.#config.onLine) {
      try {
        const result = await this.#config.onLine(trimmed, this.state);
        await this.#output(result);
      } catch (error) {
        this.#process.stderr.write(`Error: ${error.message}\n`);
      }
    }
  }

  /**
   * Shows help message with available commands
   * @returns {Promise<void>}
   */
  async #showHelp() {
    let output = "";

    // Add custom help message if provided
    if (this.#config.help) {
      output += this.#config.help + "\n\n";
    }

    const commands = [
      "`/help` - Show this help message",
      "`/exit` - Exit the application",
    ];

    for (const [name] of Object.entries(this.#config.commands)) {
      commands.push(`\`/${name}\` - Custom command`);
    }

    output += "Available commands:\n\n" + commands.join("\n");
    await this.#output(output);
  }

  /**
   * Starts the REPL
   * @returns {Promise<void>}
   */
  async start() {
    // Run setup if provided
    if (this.#config.setup) {
      await this.#config.setup();
    }

    // Non-interactive mode - process stdin
    if (!this.#process.stdin.isTTY) {
      let input = "";
      this.#process.stdin.setEncoding("utf8");

      for await (const chunk of this.#process.stdin) {
        input += chunk;
      }

      const lines = input.trim().split("\n");
      for (const line of lines) {
        await this.#handleLine(line);
      }

      this.#process.exit(0);
      return;
    }

    // Interactive mode - setup readline
    this.#rl = this.#readline.createInterface({
      input: this.#process.stdin,
      output: this.#process.stdout,
      prompt: this.#config.prompt,
    });

    this.#rl.on("line", async (line) => {
      await this.#handleLine(line);
      this.#rl.prompt();
    });

    this.#rl.on("close", () => this.#process.exit(0));
    this.#rl.on("SIGINT", () => this.#process.exit(0));

    this.#rl.prompt();
  }
}
