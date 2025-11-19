#!/usr/bin/env node
/* eslint-env node */
import { spawn } from "child_process";
import { writeFileSync, readFileSync, existsSync, openSync } from "fs";
import { parseArgs } from "node:util";

const PID_FILE = "data/dev.pid";
const LOG_FILE = "data/dev.log";
const SHUTDOWN_GRACE_PERIOD = 3000;

const MATCH_PATTERNS = ["npm run dev", "node --watch"];

const SERVICES = [
  "@copilot-ld/web",
  "@copilot-ld/agent",
  "@copilot-ld/memory",
  "@copilot-ld/llm",
  "@copilot-ld/vector",
  "@copilot-ld/graph",
  "@copilot-ld/tool",
  "@copilot-ld/trace",
];

// Silent mode flag
let silentMode = false;

// Small helpers for IO and patterns
const readJson = (path, fallback = {}) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
const writeJson = (path, obj) =>
  writeFileSync(path, JSON.stringify(obj, null, 2));
const matchPattern = () => `(${MATCH_PATTERNS.join("|")})`;

/**
 * Output helper that respects silent mode
 * @param {string} message - Message to output
 * @returns {void}
 */
const output = (message) => {
  if (!silentMode) {
    console.log(message);
  }
};

// Consistent per-service status logging
const logStatus = (service, status) => output(`${service}: ${status}`);

/**
 * List all running development processes matching known patterns
 * @returns {void}
 */
function list() {
  const child = spawn(
    "bash",
    ["-c", `ps aux | grep -E '${matchPattern()}' | grep -v grep`],
    { stdio: "inherit" },
  );
  child.on("exit", (code) => process.exit(code));
}

/**
 * Kill orphaned development processes and reset PID file
 * @returns {void}
 */
function cleanup() {
  MATCH_PATTERNS.forEach((m) => {
    spawn("bash", ["-c", `pkill -f '${m}' || true`], { stdio: "inherit" });
  });
  if (existsSync(PID_FILE)) {
    writeFileSync(PID_FILE, "{}");
  }
  output("Cleanup complete.");
}

/**
 * Check if a process is alive
 * @param {number} pgid - Process group ID (negative value)
 * @returns {boolean} True if process is alive
 */
function isProcessAlive(pgid) {
  if (!pgid || typeof pgid !== "number") {
    return false;
  }
  try {
    // Signal 0 checks if process exists without killing it
    process.kill(pgid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Start all dev servers in parallel and record their process group IDs
 * @returns {void}
 */
function start() {
  // Append-only logging: ensure log file exists but never truncate
  if (!existsSync(LOG_FILE)) {
    writeFileSync(LOG_FILE, "", { flag: "a" });
  }

  const pids = { ...readJson(PID_FILE, {}) };

  // Open log file in append mode once for all children
  const logFd = openSync(LOG_FILE, "a");

  SERVICES.forEach((service) => {
    const pgid = pids[service];

    // Check if PID exists and if process is still alive
    if (pgid && isProcessAlive(pgid)) {
      logStatus(service, "already running");
      return;
    }

    // If PID exists but process is dead, clean it up
    if (pgid) {
      logStatus(service, "stale process, restarting...");
      delete pids[service];
    } else {
      logStatus(service, "starting...");
    }

    // Spawn directly without shell redirection; append stdout/stderr via file descriptor
    const child = spawn("bash", ["-c", `npm run dev -w ${service}`], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
    });
    child.on("error", (error) => logStatus(service, `error: ${error.message}`));
    child.unref();
    // Negative PID denotes process group ID for group signaling
    pids[service] = -child.pid;
  });

  writeJson(PID_FILE, pids);
  output(`All services started. Logging to: ${LOG_FILE}`);
}

/**
 * Stop all running dev servers with graceful then forced signals
 * @returns {void}
 */
function stop() {
  if (!existsSync(PID_FILE)) {
    output("No PID file found. Services may not be running.");
    return;
  }

  try {
    const pids = readJson(PID_FILE, {});
    const entries = Object.entries(pids);
    if (entries.length === 0) {
      output("No services running.");
      return;
    }

    entries.forEach(([service, pgid]) => {
      if (!isProcessAlive(pgid)) {
        logStatus(service, "already stopped");
        return;
      }

      try {
        process.kill(pgid, "SIGTERM");
        logStatus(service, "stopping...");
      } catch (error) {
        const status =
          error.code === "ESRCH"
            ? "already stopped"
            : `error: ${error.message}`;
        logStatus(service, status);
      }
    });

    setTimeout(() => {
      entries.forEach(([service, pgid]) => {
        if (isProcessAlive(pgid)) {
          try {
            process.kill(pgid, "SIGKILL");
            logStatus(service, "force stopped");
          } catch {
            /* ignore */
          }
        }
      });
      writeFileSync(PID_FILE, "{}");
      output("All services stopped.");
    }, SHUTDOWN_GRACE_PERIOD);
  } catch (error) {
    console.error("Error reading PID file:", error.message);
  }
}

/**
 * Print usage information
 * @returns {void}
 */
function help() {
  output(
    "Usage: node dev.js [--start | --stop | --list | --cleanup] [--quiet]",
  );
  process.exit(1);
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    start: {
      type: "boolean",
      default: false,
    },
    stop: {
      type: "boolean",
      default: false,
    },
    list: {
      type: "boolean",
      default: false,
    },
    cleanup: {
      type: "boolean",
      default: false,
    },
    silent: {
      type: "boolean",
      short: "s",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
});

silentMode = values.silent;

if (values.help) {
  help();
} else if (values.start) {
  start();
} else if (values.stop) {
  stop();
} else if (values.list) {
  list();
} else if (values.cleanup) {
  cleanup();
} else {
  help();
}
