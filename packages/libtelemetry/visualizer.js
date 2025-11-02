/* eslint-env node */

/**
 * Visualizes trace spans as Mermaid sequence diagrams
 * Focuses on service interactions and call sequences
 */
export class TraceVisualizer {
  #traceIndex;

  /**
   * Creates a new TraceVisualizer instance
   * @param {import("./index.js").TraceIndex} traceIndex - Initialized TraceIndex instance
   */
  constructor(traceIndex) {
    if (!traceIndex) throw new Error("traceIndex is required");
    this.#traceIndex = traceIndex;
  }

  /**
   * Creates a visualization of traces matching the given filter
   * @param {object} filter - Filter object for trace query
   * @param {string} [filter.trace_id] - Filter by trace ID
   * @param {string} [filter.resource_id] - Filter by resource ID
   * @returns {Promise<string>} Mermaid sequence diagram of the trace
   */
  async visualize(filter = {}) {
    const spans = await this.#traceIndex.queryItems(filter);

    if (spans.length === 0) {
      return "No spans found matching the filter criteria.";
    }

    // Group spans by trace_id
    const traceGroups = this.#groupByTrace(spans);

    // If multiple traces for same resource, combine into single diagram
    if (traceGroups.size > 1 && filter.resource_id) {
      return this.#visualizeCombinedTraces(traceGroups, filter.resource_id);
    }

    // Single trace or trace_id filter - use separate diagrams
    const visualizations = [];
    for (const [traceId, traceSpans] of traceGroups) {
      visualizations.push(this.#visualizeTrace(traceId, traceSpans));
    }

    return visualizations.join("\n\n");
  }

  /**
   * Groups spans by trace_id
   * @param {import("@copilot-ld/libtype").trace.Span[]} spans - Array of spans
   * @returns {Map<string, import("@copilot-ld/libtype").trace.Span[]>} Map of trace_id to spans
   */
  #groupByTrace(spans) {
    const groups = new Map();
    for (const span of spans) {
      if (!groups.has(span.trace_id)) {
        groups.set(span.trace_id, []);
      }
      groups.get(span.trace_id).push(span);
    }
    return groups;
  }

  /**
   * Visualizes a single trace as a Mermaid sequence diagram
   * @param {string} traceId - Trace ID
   * @param {import("@copilot-ld/libtype").trace.Span[]} spans - Array of spans in the trace
   * @returns {string} Mermaid sequence diagram
   */
  #visualizeTrace(traceId, spans) {
    const lines = [];
    
    // Mermaid header
    lines.push("```mermaid");
    lines.push("sequenceDiagram");
    lines.push(`    title Trace: ${traceId}`);
    lines.push("");

    // Extract participants (services)
    const participants = this.#extractParticipants(spans);
    for (const participant of participants) {
      lines.push(`    participant ${participant}`);
    }
    lines.push("");

    // Build span map for parent lookups
    const spanMap = new Map();
    for (const span of spans) {
      spanMap.set(span.span_id, span);
    }

    // Process CLIENT spans to show interactions
    for (const span of spans) {
      if (span.kind === "CLIENT") {
        const fromService = span.attributes["service.name"];
        const toService = span.attributes["rpc.service"];
        const method = span.attributes["rpc.method"];
        
        if (fromService && toService && method) {
          lines.push(`    ${fromService}->>+${toService}: ${method}`);
          
          // Find corresponding SERVER span to show return
          const serverSpan = this.#findServerSpan(spans, span);
          if (serverSpan) {
            lines.push(`    ${toService}-->>-${fromService}: return`);
          }
        }
      }
    }

    lines.push("```");
    return lines.join("\n");
  }

  /**
   * Extracts unique service participants from spans
   * @param {import("@copilot-ld/libtype").trace.Span[]} spans - Array of spans
   * @returns {Set<string>} Set of participant service names
   */
  #extractParticipants(spans) {
    const participants = new Set();
    
    for (const span of spans) {
      const serviceName = span.attributes["service.name"];
      if (serviceName) {
        participants.add(serviceName);
      }
      
      // For CLIENT spans, also add the target service
      if (span.kind === "CLIENT") {
        const rpcService = span.attributes["rpc.service"];
        if (rpcService) {
          participants.add(rpcService);
        }
      }
    }
    
    return participants;
  }

  /**
   * Finds the corresponding SERVER span for a CLIENT span
   * @param {import("@copilot-ld/libtype").trace.Span[]} spans - Array of all spans
   * @param {import("@copilot-ld/libtype").trace.Span} clientSpan - CLIENT span to find match for
   * @returns {import("@copilot-ld/libtype").trace.Span|null} Matching SERVER span or null
   */
  #findServerSpan(spans, clientSpan) {
    return spans.find(span => 
      span.kind === "SERVER" && 
      span.parent_span_id === clientSpan.span_id
    ) || null;
  }

  /**
   * Visualizes multiple traces as a single combined Mermaid sequence diagram
   * Used when filtering by resource_id to show conversation flow across requests
   * @param {Map<string, import("@copilot-ld/libtype").trace.Span[]>} traceGroups - Map of trace_id to spans
   * @param {string} resourceId - Resource ID being visualized
   * @returns {string} Combined Mermaid sequence diagram
   */
  #visualizeCombinedTraces(traceGroups, resourceId) {
    const lines = [];
    
    // Mermaid header
    lines.push("```mermaid");
    lines.push("sequenceDiagram");
    lines.push(`    title Resource: ${resourceId}`);
    lines.push("");

    // Extract all unique participants across all traces
    const allSpans = Array.from(traceGroups.values()).flat();
    const participants = this.#extractParticipants(allSpans);
    for (const participant of participants) {
      lines.push(`    participant ${participant}`);
    }
    lines.push("");

    // Process each trace in order
    let isFirst = true;
    for (const [traceId, traceSpans] of traceGroups) {
      // Add separator note between traces
      if (!isFirst) {
        lines.push("");
        const participantList = Array.from(participants).join(",");
        lines.push(`    Note over ${participantList}: Request (trace: ${traceId.substring(0, 7)}...)`);
        lines.push("");
      } else {
        // First trace gets a note too
        const participantList = Array.from(participants).join(",");
        lines.push(`    Note over ${participantList}: Request (trace: ${traceId.substring(0, 7)}...)`);
        lines.push("");
        isFirst = false;
      }

      // Process CLIENT spans for this trace
      for (const span of traceSpans) {
        if (span.kind === "CLIENT") {
          const fromService = span.attributes["service.name"];
          const toService = span.attributes["rpc.service"];
          const method = span.attributes["rpc.method"];
          
          if (fromService && toService && method) {
            lines.push(`    ${fromService}->>+${toService}: ${method}`);
            
            // Find corresponding SERVER span to show return
            const serverSpan = this.#findServerSpan(traceSpans, span);
            if (serverSpan) {
              lines.push(`    ${toService}-->>-${fromService}: return`);
            }
          }
        }
      }
    }

    lines.push("```");
    return lines.join("\n");
  }
}
