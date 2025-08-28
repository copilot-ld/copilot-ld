/* eslint-env node */
import { ReplInterface } from "./types.js";

/**
 * Object-oriented REPL with dependency injection
 * @implements {ReplInterface}
 */
export class Repl extends ReplInterface {
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

  /** @inheritdoc */
  constructor(readline, process, formatter, handlers = {}) {
    super();
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
      console.log("\n" + this.#formatter.format(result).trim() + "\n");
    } catch (error) {
      console.error("Error:", error);
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

    const line = input.trim();

    if (line.startsWith("/")) {
      const [command, ...args] = line.slice(1).split(" ");
      const cmd = this.#allCommands[command.toLowerCase()];

      if (cmd) {
        try {
          await cmd.handler(args);
        } catch (error) {
          console.error("Error executing command:", error);
        }
      } else {
        console.log(
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
            await cmd.handler(args);
          } catch (error) {
            console.error("Error executing command:", error);
          }
        } else {
          console.log(
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

  /** @inheritdoc */
  showHelp() {
    const help = ["The available commands are:"];

    Object.entries(this.#allCommands).forEach(([name, cmd]) => {
      help.push(`- /${name.padEnd(12)}\t${cmd.help}`);
    });

    console.log("\n" + this.#formatter.format(help.join("\n")).trim() + "\n");
  }

  /** @inheritdoc */
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

export { ReplInterface };
