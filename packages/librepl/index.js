/* eslint-env node */

/**
 * Object-oriented REPL with dependency injection
 */
export class Repl {
  #readline;
  #process;
  #formatter;
  #prompt;
  #onLine;
  #setup;
  #customCommands;
  #stateConfig;
  #stateCommands;
  #stateGetters;
  #builtInCommands;
  #allCommands;
  #rl;

  /**
   * Creates a REPL instance with injected dependencies
   * @param {object} readline - Readline module for creating interfaces
   * @param {object} process - Process object for stdin/stdout and exit
   * @param {object} formatter - Formatter instance for output formatting
   * @param {object} handlers - REPL configuration and handlers
   */
  constructor(readline, process, formatter, handlers = {}) {
    if (!readline) throw new Error("readline dependency is required");
    if (!process) throw new Error("process dependency is required");
    if (!formatter) throw new Error("formatter dependency is required");

    this.#readline = readline;
    this.#process = process;
    this.#formatter = formatter;

    const {
      prompt = "> ",
      onLine = null,
      setup = null,
      commands = {},
      state = {},
    } = handlers;

    this.#prompt = prompt;
    this.#onLine = onLine;
    this.#setup = setup;
    this.#customCommands = commands;
    this.#stateConfig = this.#parseCommandLineArgs(state);

    this.#stateCommands = {};
    this.#stateGetters = {};
    this.#initializeState();

    this.#builtInCommands = {
      help: {
        help: "Show this help message",
        handler: () => this.showHelp(),
      },
      clear: {
        help: "Clear the history",
        handler: () => console.clear(),
      },
      exit: {
        help: "Exit the application",
        handler: () => {
          this.#process.exit(0);
        },
      },
    };

    const combinedCommands = {
      ...this.#builtInCommands,
      ...this.#toLowerCaseKeys(this.#stateCommands),
      ...this.#toLowerCaseKeys(this.#customCommands),
    };

    // Sort commands alphabetically by command name
    this.#allCommands = Object.fromEntries(
      Object.entries(combinedCommands).sort(([a], [b]) => a.localeCompare(b)),
    );

    this.#rl = null;
  }

  /**
   * Converts object keys to lowercase
   * @param {object} obj - Object to convert
   * @returns {object} Object with lowercase keys
   */
  #toLowerCaseKeys(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key.toLowerCase()] = value;
    }
    return result;
  }

  /**
   * Parses command line arguments to override initial state values
   * @param {object} state - State configuration object
   * @returns {object} State configuration with command line overrides
   */
  #parseCommandLineArgs(state) {
    const args = this.#process.argv.slice(2);
    const updatedState = { ...state };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--") && i + 1 < args.length) {
        const stateName = arg.slice(2);
        const value = args[i + 1];

        if (updatedState[stateName]) {
          updatedState[stateName] = {
            ...updatedState[stateName],
            initial: value,
          };
          i++; // Skip the value argument
        }
      }
    }

    return updatedState;
  }

  /**
   * Initializes state variables and their corresponding commands
   */
  #initializeState() {
    Object.entries(this.#stateConfig).forEach(([name, stateHandler]) => {
      const { command, get } = this.#createStateCommand(
        name,
        stateHandler.initial,
        stateHandler.description,
      );
      this.#stateCommands[name] = command;
      this.#stateGetters[name] = get;
    });
  }

  /**
   * Creates a state variable command that gets/sets a value
   * @param {string} name - Variable name
   * @param {any} initialValue - Initial value
   * @param {string} description - Brief description for help
   * @returns {object} Command object and getter function
   */
  #createStateCommand(name, initialValue, description) {
    let value = initialValue;

    const command = {
      help: description,
      handler: (args) => {
        if (args.length === 0) {
          return;
        }
        value = args[0];
      },
    };

    return {
      command,
      get: () => value,
      set: (newValue) => (value = newValue),
    };
  }

  /**
   * Safely executes the onLine handler with error handling
   * @param {string} input - User input
   * @returns {Promise<void>}
   */
  async #safeOnLine(input) {
    if (!this.#onLine) return;

    try {
      const result = await this.#onLine(input, this.#stateGetters);
      if (result !== undefined && result !== null) {
        const text = "\n" + this.#formatter.format(result).trim() + "\n";
        this.#process.stdout.write(text);
      }
    } catch (error) {
      this.#process.stderr.write(`Error: ${error}\n`);
    }
  }

  /**
   * Handles stdin input for non-interactive mode
   * @returns {Promise<void>}
   */
  async #handleStdin() {
    let input = "";

    this.#process.stdin.setEncoding("utf8");

    for await (const chunk of this.#process.stdin) {
      input += chunk;
    }

    // Split input by newlines to handle multiple commands
    const lines = input
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Handle exit command
      if (trimmedLine.toLowerCase() === "exit") {
        this.#process.stdout.write(
          "Goodbye! Let me know if you need any DevSecOps assistance in the future.\n",
        );
        break;
      }

      if (trimmedLine.startsWith("/")) {
        const [command, ...args] = trimmedLine.slice(1).split(" ");
        const cmd = this.#allCommands[command.toLowerCase()];

        if (cmd) {
          try {
            const result = await cmd.handler(args);
            if (result !== undefined && result !== null) {
              const text = "\n" + this.#formatter.format(result).trim() + "\n";
              this.#process.stdout.write(text);
            }
          } catch (error) {
            this.#process.stderr.write(
              `Error executing command: ${error?.message || String(error)}\n`,
            );
          }
        } else {
          this.#process.stdout.write(
            "\n" +
              this.#formatter.format(
                "Error: Unknown command. Use `/help` for available commands.",
              ) +
              "\n",
          );
        }
      } else {
        await this.#safeOnLine(trimmedLine);
      }

      // Add a small delay between commands to simulate interactive behavior
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Sets up readline interface for interactive mode
   * @returns {object} The readline interface
   */
  #setupInteractiveMode() {
    this.#rl = this.#readline.createInterface({
      input: this.#process.stdin,
      output: this.#process.stdout,
      prompt: this.#prompt,
    });

    this.#rl.on("line", async (input) => {
      const line = input.trim();

      if (line.startsWith("/")) {
        const [command, ...args] = line.slice(1).split(" ");
        const cmd = this.#allCommands[command.toLowerCase()];

        if (cmd) {
          try {
            const result = await cmd.handler(args);
            if (result !== undefined && result !== null) {
              const text = "\n" + this.#formatter.format(result).trim() + "\n";
              this.#process.stdout.write(text);
            }
          } catch (error) {
            this.#process.stderr.write(
              `Error executing command: ${error?.message || String(error)}\n`,
            );
          }
        } else {
          this.#process.stdout.write(
            "\n" +
              this.#formatter.format(
                "Error: Unknown command. Use `/help` for available commands.",
              ) +
              "\n",
          );
        }
      } else {
        await this.#safeOnLine(line);
      }
      this.#rl.prompt();
    });

    this.#rl.on("close", () => {
      this.#process.exit(0);
    });

    this.#rl.on("SIGINT", () => {
      this.#process.exit(0);
    });

    return this.#rl;
  }

  /**
   * Shows help message with all available commands
   * @returns {void}
   */
  showHelp() {
    const help = ["The available commands are:"];

    Object.entries(this.#allCommands).forEach(([name, cmd]) => {
      help.push(`- /${name.padEnd(12)}\t${cmd.help}`);
    });

    this.#process.stdout.write(
      "\n" + this.#formatter.format(help.join("\n")).trim() + "\n",
    );
  }

  /**
   * Starts the REPL in either interactive or non-interactive mode
   * @returns {Promise<void>}
   */
  async start() {
    if (this.#setup) {
      await this.#setup();
    }

    if (!this.#process.stdin.isTTY) {
      await this.#handleStdin();
      this.#process.exit(0);
    } else {
      this.#rl = this.#setupInteractiveMode();
      this.#rl.prompt();
    }
  }
}
