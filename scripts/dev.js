/* eslint-env node */
import { spawn } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";

const PID_FILE = "data/dev.pid";
const LOG_FILE = "data/dev.log";

const MATCH_PATTERNS = ["npm run dev", "node --watch"];

const SERVICES = [
  "@copilot-ld/web",
  "@copilot-ld/copilot",
  "@copilot-ld/agent",
  "@copilot-ld/memory",
  "@copilot-ld/llm",
  "@copilot-ld/vector",
];

// Small helpers for IO and patterns
const readJson = (path, fallback = {}) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
const writeJson = (path, obj) =>
  writeFileSync(path, JSON.stringify(obj, null, 2));
const matchPattern = () => `(${MATCH_PATTERNS.join("|")})`;

// Consistent per-service status logging
const logStatus = (service, status) => console.log(`${service}: ${status}`);

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
  writeFileSync(PID_FILE, "{}");
  console.log("Cleanup complete.");
}

/**
 * Start all dev servers in parallel and record their process group IDs
 * @returns {void}
 */
function start() {
  writeFileSync(LOG_FILE, "", { flag: "w" });

  const pids = { ...readJson(PID_FILE, {}) };

  SERVICES.forEach((service) => {
    if (pids[service]) {
      logStatus(service, "already running");
      return;
    }

    logStatus(service, "starting...");
    const child = spawn(
      "bash",
      ["-c", `npm run dev -w ${service} >> ${LOG_FILE} 2>&1`],
      { detached: true, stdio: "ignore" },
    );
    child.on("error", (error) => logStatus(service, `error: ${error.message}`));
    child.unref();
    // Negative PID denotes process group ID for group signaling
    pids[service] = -child.pid;
  });

  writeJson(PID_FILE, pids);
  console.log(`All services started. Logging to: ${LOG_FILE}`);
}

/**
 * Stop all running dev servers with graceful then forced signals
 * @returns {void}
 */
function stop() {
  if (!existsSync(PID_FILE)) {
    console.log("No PID file found. Services may not be running.");
    return;
  }

  try {
    const pids = readJson(PID_FILE, {});
    const entries = Object.entries(pids);
    if (entries.length === 0) {
      console.log("No services running.");
      return;
    }

    entries.forEach(([service, pgid]) => {
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
      entries.forEach(([, pgid]) => {
        try {
          process.kill(pgid, "SIGKILL");
        } catch {
          /* ignore */
        }
      });
      writeFileSync(PID_FILE, "{}");
      console.log("All services stopped.");
    }, 2000);
  } catch (error) {
    console.error("Error reading PID file:", error.message);
  }
}

/**
 * Print usage information
 * @returns {void}
 */
function help() {
  console.log("Usage: node dev.js [--start | --stop | --list | --cleanup]");
  process.exit(1);
}

const cmd = process.argv[2];
const commands = new Map([
  ["--start", start],
  ["--stop", stop],
  ["--list", list],
  ["--cleanup", cleanup],
  ["--help", help],
  ["-h", help],
]);

if (!cmd || !commands.has(cmd)) help();
commands.get(cmd)();
