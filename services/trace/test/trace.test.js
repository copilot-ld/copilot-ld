/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { TraceService } from "../index.js";

describe("trace service", () => {
  describe("TraceService", () => {
    test("exports TraceService class", () => {
      assert.strictEqual(typeof TraceService, "function");
      assert.ok(TraceService.prototype);
    });

    test("TraceService has RecordSpan method", () => {
      assert.strictEqual(typeof TraceService.prototype.RecordSpan, "function");
    });

    test("TraceService has QuerySpans method", () => {
      assert.strictEqual(typeof TraceService.prototype.QuerySpans, "function");
    });

    test("TraceService has FlushTraces method", () => {
      assert.strictEqual(typeof TraceService.prototype.FlushTraces, "function");
    });

    test("TraceService has shutdown method", () => {
      assert.strictEqual(typeof TraceService.prototype.shutdown, "function");
    });

    test("TraceService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(TraceService.length, 4); // config, traceIndex, exporter, logFn
    });

    test("TraceService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(TraceService.prototype);
      assert(methods.includes("RecordSpan"));
      assert(methods.includes("QuerySpans"));
      assert(methods.includes("FlushTraces"));
      assert(methods.includes("shutdown"));
      assert(methods.includes("constructor"));
    });
  });

  describe("TraceService business logic", () => {
    let mockConfig;
    let mockTraceIndex;
    let mockExporter;

    beforeEach(() => {
      mockConfig = {
        name: "trace",
      };

      mockTraceIndex = {
        index: new Map(),
        add: async function (span) {
          this.index.set(span.id, span);
        },
        flush: async function () {
          return this.index.size;
        },
        shutdown: async function () {
          this.index.clear();
        },
        queryItems: async function (options) {
          const results = [];
          for (const [id, span] of this.index) {
            // If prefix is specified, filter by trace_id
            if (options.prefix && !span.trace_id.startsWith(options.prefix)) {
              continue;
            }
            results.push({ id });
            if (options.limit && results.length >= options.limit) {
              break;
            }
          }
          return results;
        },
      };

      mockExporter = {
        exported: [],
        export: async function (span) {
          this.exported.push(span);
        },
        shutdown: async function () {
          this.exported = [];
        },
      };
    });

    test("creates service instance with trace index", () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("creates service instance with exporter", () => {
      const service = new TraceService(
        mockConfig,
        mockTraceIndex,
        mockExporter,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("throws error if traceIndex is missing", () => {
      assert.throws(
        () => {
          new TraceService(mockConfig);
        },
        { message: "traceIndex is required" },
      );
    });

    test("RecordSpan stores span in index", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      const spanRequest = {
        trace_id: "trace123",
        span_id: "span456",
        parent_span_id: "",
        name: "TestOperation",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: { "service.name": "test-service" },
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      };

      const result = await service.RecordSpan(spanRequest);

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.strictEqual(mockTraceIndex.index.size, 1);
      assert.ok(mockTraceIndex.index.has("span456"));
    });

    test("RecordSpan exports span when exporter is configured", async () => {
      const service = new TraceService(
        mockConfig,
        mockTraceIndex,
        mockExporter,
      );

      const spanRequest = {
        trace_id: "trace123",
        span_id: "span456",
        parent_span_id: "",
        name: "TestOperation",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: { "service.name": "test-service" },
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      };

      await service.RecordSpan(spanRequest);

      assert.strictEqual(mockExporter.exported.length, 1);
      assert.strictEqual(mockExporter.exported[0].span_id, "span456");
    });

    test("RecordSpan does not export when exporter is null", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex, null);

      const spanRequest = {
        trace_id: "trace123",
        span_id: "span789",
        parent_span_id: "",
        name: "TestOperation",
        kind: "SPAN_KIND_INTERNAL",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      };

      const result = await service.RecordSpan(spanRequest);

      assert.ok(result);
      assert.strictEqual(result.success, true);
      // No error thrown even though exporter is null
    });

    test("QuerySpans returns stored spans", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      // Record a span first
      await service.RecordSpan({
        trace_id: "trace123",
        span_id: "span456",
        parent_span_id: "",
        name: "TestOperation",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: { "service.name": "test-service" },
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      const result = await service.QuerySpans({});

      assert.ok(result);
      assert.ok(Array.isArray(result.spans));
      assert.strictEqual(result.spans.length, 1);
      assert.strictEqual(result.spans[0].span_id, "span456");
    });

    test("QuerySpans filters by trace_id", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      // Record spans with different trace IDs
      await service.RecordSpan({
        trace_id: "trace123",
        span_id: "span1",
        parent_span_id: "",
        name: "Operation1",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      await service.RecordSpan({
        trace_id: "trace456",
        span_id: "span2",
        parent_span_id: "",
        name: "Operation2",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      const result = await service.QuerySpans({ trace_id: "trace123" });

      assert.ok(result);
      assert.ok(Array.isArray(result.spans));
      assert.strictEqual(result.spans.length, 1);
      assert.strictEqual(result.spans[0].trace_id, "trace123");
    });

    test("QuerySpans respects limit parameter", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      // Record multiple spans
      for (let i = 0; i < 5; i++) {
        await service.RecordSpan({
          trace_id: "trace123",
          span_id: `span${i}`,
          parent_span_id: "",
          name: `Operation${i}`,
          kind: "SPAN_KIND_INTERNAL",
          start_time_unix_nano: "1698345600000000000",
          end_time_unix_nano: "1698345601000000000",
          attributes: {},
          events: [],
          status: { code: "STATUS_CODE_OK", message: "" },
        });
      }

      const result = await service.QuerySpans({ limit: 3 });

      assert.ok(result);
      assert.ok(Array.isArray(result.spans));
      assert.strictEqual(result.spans.length, 3);
    });

    test("FlushTraces returns flushed count", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      // Record some spans
      await service.RecordSpan({
        trace_id: "trace123",
        span_id: "span1",
        parent_span_id: "",
        name: "Operation1",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      const result = await service.FlushTraces({});

      assert.ok(result);
      assert.strictEqual(typeof result.flushed_count, "number");
      assert.ok(result.flushed_count >= 0);
    });

    test("shutdown calls traceIndex shutdown", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      // Record a span
      await service.RecordSpan({
        trace_id: "trace123",
        span_id: "span1",
        parent_span_id: "",
        name: "Operation1",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      assert.strictEqual(mockTraceIndex.index.size, 1);

      await service.shutdown();

      assert.strictEqual(mockTraceIndex.index.size, 0);
    });

    test("shutdown calls exporter shutdown when configured", async () => {
      const service = new TraceService(
        mockConfig,
        mockTraceIndex,
        mockExporter,
      );

      // Export a span
      await service.RecordSpan({
        trace_id: "trace123",
        span_id: "span1",
        parent_span_id: "",
        name: "Operation1",
        kind: "SPAN_KIND_SERVER",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: {},
        events: [],
        status: { code: "STATUS_CODE_OK", message: "" },
      });

      assert.strictEqual(mockExporter.exported.length, 1);

      await service.shutdown();

      assert.strictEqual(mockExporter.exported.length, 0);
    });

    test("RecordSpan handles span with events", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      const spanRequest = {
        trace_id: "trace123",
        span_id: "span456",
        parent_span_id: "span123",
        name: "TestOperation",
        kind: "SPAN_KIND_CLIENT",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: { "service.name": "test-service", "rpc.method": "Test" },
        events: [
          {
            name: "cache_hit",
            time_unix_nano: "1698345600500000000",
            attributes: { hit_rate: "0.95" },
          },
        ],
        status: { code: "STATUS_CODE_OK", message: "" },
      };

      const result = await service.RecordSpan(spanRequest);

      assert.ok(result);
      assert.strictEqual(result.success, true);

      const stored = mockTraceIndex.index.get("span456");
      assert.ok(stored);
      assert.strictEqual(stored.events.length, 1);
      assert.strictEqual(stored.events[0].name, "cache_hit");
    });

    test("RecordSpan handles error status", async () => {
      const service = new TraceService(mockConfig, mockTraceIndex);

      const spanRequest = {
        trace_id: "trace123",
        span_id: "span789",
        parent_span_id: "",
        name: "FailedOperation",
        kind: "SPAN_KIND_INTERNAL",
        start_time_unix_nano: "1698345600000000000",
        end_time_unix_nano: "1698345601000000000",
        attributes: { "service.name": "test-service" },
        events: [],
        status: {
          code: "STATUS_CODE_ERROR",
          message: "Connection timeout",
        },
      };

      const result = await service.RecordSpan(spanRequest);

      assert.ok(result);
      assert.strictEqual(result.success, true);

      const stored = mockTraceIndex.index.get("span789");
      assert.ok(stored);
      assert.strictEqual(stored.status.code, "STATUS_CODE_ERROR");
      assert.strictEqual(stored.status.message, "Connection timeout");
    });
  });
});
