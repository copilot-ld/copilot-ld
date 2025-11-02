/* eslint-env node */
import { BufferedIndex } from "@copilot-ld/libindex";

// Re-export classes for direct use
// Note: Tracer is NOT exported here to avoid circular dependency on generated
// code (via libtype). Import Tracer directly from ./tracer.js
export { Logger, createLogger } from "./logger.js";
export { Observer, createObserver } from "./observer.js";
export { TraceVisualizer } from "./visualizer.js";

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
   * Finds all span IDs with matching resource_id and optional trace_id
   * @param {string} resource_id - Resource ID to match
   * @param {string} [trace_id] - Optional trace ID filter
   * @returns {Set<string>} Set of matching span IDs
   */
  #findMatchingSpanIds(resource_id, trace_id) {
    const matchingIds = new Set();
    for (const item of this.index.values()) {
      const span = item.span;
      if (trace_id && span.trace_id !== trace_id) continue;
      if (span.resource?.attributes?.id === resource_id) {
        matchingIds.add(span.span_id);
      }
    }
    return matchingIds;
  }

  /**
   * Expands span IDs to include all ancestors in trace hierarchy
   * @param {Set<string>} spanIds - Initial set of span IDs
   */
  #includeAncestors(spanIds) {
    for (const spanId of spanIds) {
      const item = this.index.get(spanId);
      let currentSpan = item?.span;
      while (currentSpan?.parent_span_id) {
        spanIds.add(currentSpan.parent_span_id);
        const parentItem = this.index.get(currentSpan.parent_span_id);
        currentSpan = parentItem?.span;
      }
    }
  }

  /**
   * Sorts spans chronologically by start time
   * @param {import("@copilot-ld/libtype").trace.Span[]} spans - Array of spans to sort
   * @returns {import("@copilot-ld/libtype").trace.Span[]} Sorted array of spans
   */
  #sortSpansByTime(spans) {
    return spans.sort((a, b) => {
      const timeA = BigInt(a.start_time_unix_nano);
      const timeB = BigInt(b.start_time_unix_nano);
      return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
    });
  }

  /**
   * Queries spans from the index using trace-specific filters
   * Overrides the base queryItems to support trace_id and resource_id filtering
   * When filtering by resource_id, includes parent spans in the trace hierarchy
   * even if they don't have the resource_id set yet (e.g., initial request spans)
   * Returns spans sorted chronologically by start time
   * @param {object} filter - Filter object for query constraints
   * @param {string} [filter.trace_id] - Filter by trace ID
   * @param {string} [filter.resource_id] - Filter by resource ID
   * @returns {Promise<import("@copilot-ld/libtype").trace.Span[]>} Array of spans matching the filter, sorted by start time
   */
  async queryItems(filter = {}) {
    if (!this.loaded) await this.loadData();

    const { trace_id, resource_id } = filter;

    if (resource_id) {
      const matchingIds = this.#findMatchingSpanIds(resource_id, trace_id);
      this.#includeAncestors(matchingIds);
      const spans = Array.from(matchingIds).map(id => this.index.get(id).span);
      return this.#sortSpansByTime(spans);
    }

    // Simple filtering without resource_id hierarchy logic
    const spans = [];
    for (const item of this.index.values()) {
      const span = item.span;
      if (!trace_id || span.trace_id === trace_id) {
        spans.push(span);
      }
    }
    return this.#sortSpansByTime(spans);
  }
}
