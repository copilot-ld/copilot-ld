#!/usr/bin/env node
/* eslint-env node */
import { EvaluationIndex, EvaluationReporter } from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";
import { TraceVisualizer } from "@copilot-ld/libtelemetry/visualizer.js";
import { createServiceConfig } from "@copilot-ld/libconfig";

/**
 * Main reporting workflow
 * Generates summary and per-case reports from evaluation index
 * @returns {Promise<void>} Resolves when reporting is complete
 */
async function main() {
  // Initialize storage
  const evalStorage = createStorage("eval");
  const traceStorage = createStorage("traces");
  const memoryStorage = createStorage("memories");

  // Initialize evaluation index, trace index, and visualizer
  const evaluationIndex = new EvaluationIndex(evalStorage);
  const traceIndex = new TraceIndex(traceStorage, "index.jsonl");
  const traceVisualizer = new TraceVisualizer(traceIndex);

  // Initialize agent config
  const agentConfig = await createServiceConfig("agent");

  const reporter = new EvaluationReporter(
    agentConfig,
    evaluationIndex,
    traceVisualizer,
    memoryStorage,
  );

  console.log("Generating evaluation reports...");

  // Generate all reports (summary + individual cases)
  await reporter.generateAll(evalStorage);

  console.log("Reports generated successfully:");
  console.log("  - eval/SUMMARY.md");

  const scenarios = await evaluationIndex.getAllScenarios();
  for (const scenario of scenarios) {
    console.log(`  - eval/${scenario}.md`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
