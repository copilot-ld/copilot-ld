#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { EvaluationIndex, EvaluationReporter } from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";
import { TraceVisualizer } from "@copilot-ld/libtelemetry/visualizer.js";
import { MemoryClient } from "../../../generated/services/memory/client.js";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libtelemetry";
import { PromptLoader } from "@copilot-ld/libprompt";

const logger = createLogger("eval-report");

/**
 * Main reporting workflow
 * Generates summary and per-case reports from evaluation index
 * @returns {Promise<void>} Resolves when reporting is complete
 */
async function main() {
  // Initialize storage
  const evalStorage = createStorage("eval");
  const traceStorage = createStorage("traces");
  const configStorage = createStorage("config");

  // Initialize evaluation index, trace index, and visualizer
  const evaluationIndex = new EvaluationIndex(evalStorage);
  const traceIndex = new TraceIndex(traceStorage, "index.jsonl");
  const traceVisualizer = new TraceVisualizer(traceIndex);

  // Initialize memory client and agent config
  const agentConfig = await createServiceConfig("agent");
  const memoryConfig = await createServiceConfig("memory");
  const memoryClient = new MemoryClient(memoryConfig);

  // Create prompt loader for reporter
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const promptLoader = new PromptLoader(join(__dirname, "../prompts"));

  const reporter = new EvaluationReporter(
    agentConfig,
    evaluationIndex,
    traceVisualizer,
    memoryClient,
    promptLoader,
    configStorage,
  );

  logger.info("main", "Generating evaluation reports");

  // Generate all reports (summary + individual cases)
  await reporter.generateAll(evalStorage);

  logger.info("main", "Reports generated successfully");
  logger.info("main", "Summary report", { file: "eval/SUMMARY.md" });

  const scenarios = await evaluationIndex.getAllScenarios();
  for (const scenario of scenarios) {
    logger.info("main", "Scenario report", { file: `eval/${scenario}.md` });
  }
}

main().catch((error) => {
  logger.exception("main", error);
  process.exit(1);
});
