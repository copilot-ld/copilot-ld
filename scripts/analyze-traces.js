/* eslint-env node */
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Prints counts grouped by key
 * @param {Map} counts - Map of keys to counts
 * @param {string} title - Section title
 */
function printCounts(counts, title) {
  console.log(`\n=== ${title} ===`);
  for (const [key, count] of [...counts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${key}: ${count} spans`);
  }
}

/**
 * Analyzes trace data for correctness and cohesion
 * @param {string} tracePath - Path to the trace file
 */
function analyzeTraces(tracePath) {
  const content = readFileSync(tracePath, "utf-8");
  const spans = content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  console.log("=== TRACE ANALYSIS ===\n");
  console.log(`Total spans: ${spans.length}`);

  // Group by trace ID
  const traceGroups = new Map();
  for (const span of spans) {
    if (!traceGroups.has(span.trace_id)) {
      traceGroups.set(span.trace_id, []);
    }
    traceGroups.get(span.trace_id).push(span);
  }
  console.log(`Unique traces: ${traceGroups.size}`);

  // Count by service
  const serviceCounts = new Map();
  for (const span of spans) {
    const service = span.attributes?.["service.name"] || "unknown";
    serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
  }
  printCounts(serviceCounts, "SPANS BY SERVICE");

  // Count by operation
  const opCounts = new Map();
  for (const span of spans) {
    opCounts.set(span.name, (opCounts.get(span.name) || 0) + 1);
  }
  printCounts(opCounts, "SPANS BY OPERATION");

  // Check for context propagation issues
  console.log("\n=== CONTEXT PROPAGATION ===");
  const orphans = spans.filter(
    (s) =>
      s.parent_span_id && !spans.some((p) => p.span_id === s.parent_span_id),
  );
  if (orphans.length === 0) {
    console.log("✅ All spans have valid parent references");
  } else {
    console.log(`⚠️  ${orphans.length} spans missing parent context`);
  }

  // Show example traces
  console.log("\n=== EXAMPLE TRACES ===");
  let count = 0;
  for (const [traceId, traceSpans] of traceGroups.entries()) {
    if (count >= 3) break;
    console.log(
      `\nTrace ${traceId.substring(0, 8)}... (${traceSpans.length} spans):`,
    );
    printTrace(traceSpans);
    count++;
  }
}

/**
 * Prints trace hierarchy
 * @param {Array} spans - Array of spans in trace
 */
function printTrace(spans) {
  const spanIds = new Set(spans.map((s) => s.span_id));
  const roots = spans.filter(
    (s) => !s.parent_span_id || !spanIds.has(s.parent_span_id),
  );

  for (const root of roots) {
    printSpanTree(root, spans, 0);
  }
}

/**
 * Prints span and children recursively
 * @param {object} span - Span to print
 * @param {Array} spans - All spans
 * @param {number} depth - Tree depth
 */
function printSpanTree(span, spans, depth) {
  const service = span.attributes?.["service.name"] || "?";
  const duration = formatDuration(span);
  console.log(`${"  ".repeat(depth)}${span.name} [${service}] ${duration}`);

  const children = spans.filter((s) => s.parent_span_id === span.span_id);
  for (const child of children) {
    printSpanTree(child, spans, depth + 1);
  }
}

/**
 * Formats span duration
 * @param {object} span - Span to format
 * @returns {string} Formatted duration
 */
function formatDuration(span) {
  const start = toBigInt(span.start_time_unix_nano);
  const end = toBigInt(span.end_time_unix_nano);
  const ms = Number(end - start) / 1000000;
  return `(${ms.toFixed(2)}ms)`;
}

/**
 * Converts time to BigInt nanoseconds
 * @param {object|string|number|bigint} time - Time value
 * @returns {bigint} Nanoseconds
 */
function toBigInt(time) {
  if (typeof time === "bigint") return time;
  if (typeof time === "string" || typeof time === "number") return BigInt(time);
  if (time && typeof time === "object") {
    const low = BigInt(time.low >>> 0);
    const high = BigInt(time.high);
    return (high << 32n) | low;
  }
  return 0n;
}

// Run analysis
const tracePath = resolve(
  process.cwd(),
  "data/traces",
  process.argv[2] || "2025-10-28.jsonl",
);
analyzeTraces(tracePath);
