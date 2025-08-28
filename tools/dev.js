/* eslint-env node */
import { spawn } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";

const PID_FILE = "data/dev.pid";
const LOG_FILE = "data/dev.log";
const SERVICES = [
  "@copilot-ld/web",
  "@copilot-ld/copilot",
  "@copilot-ld/agent",
  "@copilot-ld/llm",
  "@copilot-ld/vector",
  "@copilot-ld/text",
  "@copilot-ld/history",
];

/**
 * List all running node and npm processes
 */
function list() {
  const child = spawn(
    "bash",
    ["-c", "ps aux | grep -E '(node|npm)' | grep -v grep"],
    { stdio: "inherit" },
  );
  child.on("exit", (code) => process.exit(code));
}

/**
 * Kill orphaned development processes
 */
function cleanup() {
  const match = ["npm run dev", "node --watch"];

  match.forEach((m) => {
    spawn("bash", ["-c", `pkill -f '${m}' || true`], { stdio: "inherit" });
  });

  writeFileSync(PID_FILE, "{}");
  console.log("Cleanup complete.");
}

/**
 * Start all dev servers in parallel
 */
function start() {
  writeFileSync(LOG_FILE, "", { flag: "w" });

  const existingPids = existsSync(PID_FILE)
    ? JSON.parse(readFileSync(PID_FILE, "utf8"))
    : {};
  const pids = { ...existingPids };

  SERVICES.forEach((service) => {
    if (pids[service]) {
      console.log(`Skipping ${service}: already running`);
      return;
    }

    const command = `npm run dev -w ${service} >> ${LOG_FILE} 2>&1`;
    const child = spawn("bash", ["-c", command], {
      detached: true,
      stdio: "ignore",
    });
    child.on("error", (error) =>
      console.error(`Failed to start ${service}:`, error.message),
    );
    child.unref();
    // Store the negative PID to represent the process group ID
    pids[service] = -child.pid;
  });

  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  console.log(`Started services. Logging to: ${LOG_FILE}`);
}

/**
 * Stop all running dev servers
 */
function stop() {
  if (!existsSync(PID_FILE)) {
    console.log("No PID file found. Services may not be running.");
    return;
  }

  try {
    const pids = JSON.parse(readFileSync(PID_FILE, "utf8"));

    if (!pids || Object.keys(pids).length === 0) {
      console.log("No services running.");
      return;
    }

    // Stop all services
    Object.entries(pids).forEach(([service, pgid]) => {
      try {
        process.kill(pgid, "SIGTERM");
        console.log(`Stopping ${service}...`);
      } catch (error) {
        const status =
          error.code === "ESRCH"
            ? "already stopped"
            : `error: ${error.message}`;
        console.log(`${service}: ${status}`);
      }
    });

    // Force kill and cleanup after graceful shutdown attempt
    setTimeout(() => {
      Object.values(pids).forEach((pgid) => {
        try {
          process.kill(pgid, "SIGKILL");
        } catch {
          /* ignore */
        }
      });
      writeFileSync(PID_FILE, "{}");
      console.log("Services stopped.");
    }, 2000);
  } catch (error) {
    console.error("Error reading PID file:", error.message);
  }
}

/**
 * Show help information
 */
function help() {
  console.log("Usage: node dev.js [--start | --stop | --list | --cleanup]");
  process.exit(1);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "--help" || cmd === "-h") help();
if (cmd === "--start") start();
else if (cmd === "--stop") stop();
else if (cmd === "--list") list();
else if (cmd === "--cleanup") cleanup();
else help();
