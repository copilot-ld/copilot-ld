/* eslint-env node */
import { BufferedIndex } from "@copilot-ld/libindex";

// Re-export classes for direct use
// Note: Tracer is NOT exported here to avoid circular dependency on generated
// code (via libtype). Import Tracer directly from ./tracer.js
export { Logger, createLogger } from "./logger.js";
export { Observer, createObserver } from "./observer.js";
export { TELEMETRY_ATTRIBUTES_MAP } from "./attributes.js";

/**
 * Specialized index for trace spans with custom filtering
 * Extends BufferedIndex to provide trace-specific query capabilities
 * @augments BufferedIndex
 */
export class TraceIndex extends BufferedIndex {

  /**
   * Adds a span to the index with custom item structure
   * @param {import("@copilot-ld/libtype").trace.Span} span - Span to add to the index
   * @returns {Promise<void>}
   */
  async add(span) {
    const item = {
      id: span.span_id,
      span: span,
    };
    await super.add(item);
  }

  /**
   * Queries spans from the index using trace-specific filters
   * Overrides the base queryItems to support trace_id and resource_id filtering
   * @param {object} filter - Filter object for query constraints
   * @param {string} [filter.trace_id] - Filter by trace ID
   * @param {string} [filter.resource_id] - Filter by resource ID
   * @returns {Promise<import("@copilot-ld/libtype").trace.Span[]>} Array of spans matching the filter
   */
  async queryItems(filter = {}) {
    if (!this.loaded) await this.loadData();

    const { trace_id, resource_id } = filter;
    const spans = [];

    // Iterate over all items and apply filters
    for (const item of this.index.values()) {
      // Apply trace_id filter if specified
      if (trace_id && item.span.trace_id !== trace_id) continue;

      // Apply resource_id filter if specified
      if (resource_id && item.span.resource_id !== resource_id) continue;

      // Add matching span to results
      spans.push(item.span);
    }

    return spans;
  }
}
