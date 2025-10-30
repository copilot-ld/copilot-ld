/* eslint-env node */
import { describe, test } from "node:test";
import assert from "node:assert";

import { Tracer } from "../tracer.js";

describe("Tracer", () => {
  describe("AsyncLocalStorage context isolation", () => {
    test("maintains separate span contexts for concurrent operations", async () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      // Simulate two concurrent operations
      const operation1 = async () => {
        const span1 = tracer.startSpan("operation1", { kind: "SERVER" });
        const context = tracer.getSpanContext();

        // Store span in AsyncLocalStorage
        return context.run(span1, async () => {
          // Simulate some async work
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Verify we can still retrieve the correct span
          const currentSpan = context.getStore();
          assert.strictEqual(currentSpan.spanId, span1.spanId);
          assert.strictEqual(currentSpan.traceId, span1.traceId);
          return span1.spanId;
        });
      };

      const operation2 = async () => {
        const span2 = tracer.startSpan("operation2", { kind: "SERVER" });
        const context = tracer.getSpanContext();

        // Store span in AsyncLocalStorage
        return context.run(span2, async () => {
          // Simulate some async work
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Verify we can still retrieve the correct span
          const currentSpan = context.getStore();
          assert.strictEqual(currentSpan.spanId, span2.spanId);
          assert.strictEqual(currentSpan.traceId, span2.traceId);
          return span2.spanId;
        });
      };

      // Run both operations concurrently
      const [spanId1, spanId2] = await Promise.all([
        operation1(),
        operation2(),
      ]);

      // Verify spans are different
      assert.notStrictEqual(spanId1, spanId2);
    });

    test("startClientSpan reads parent from AsyncLocalStorage", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });
      const context = tracer.getSpanContext();

      // Create a parent SERVER span
      const parentSpan = tracer.startSpan("parent", { kind: "SERVER" });

      // Run within AsyncLocalStorage context
      context.run(parentSpan, () => {
        // Create a CLIENT span - should automatically use parent from storage
        const clientSpan = tracer.startClientSpan("test-service", "testMethod");

        // Verify client span was created and shares trace ID with parent
        assert.strictEqual(clientSpan.traceId, parentSpan.traceId);
        assert.ok(clientSpan.spanId);
        assert.notStrictEqual(clientSpan.spanId, parentSpan.spanId);
      });
    });

    test("startServerSpan extracts trace context from metadata", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      // Mock gRPC metadata with trace context
      const metadata = {
        get: (key) => {
          if (key === "x-trace-id") return ["test-trace-id"];
          if (key === "x-span-id") return ["test-parent-span-id"];
          return [];
        },
      };

      const serverSpan = tracer.startServerSpan(
        "test-service",
        "testMethod",
        metadata,
      );

      // Verify trace context was extracted (trace ID should match)
      assert.strictEqual(serverSpan.traceId, "test-trace-id");
      assert.ok(serverSpan.spanId);
    });
  });

  describe("Request attribute parsing", () => {
    test("getMetadata extracts string and count attributes from metadata", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      // Mock gRPC metadata with trace context and request attributes
      const metadata = {
        get: (key) => {
          const values = {
            "x-trace-id": ["test-trace-id"],
            "x-span-id": ["test-parent-span-id"],
            "x-resource-id": ["resource-123"],
            "x-tool-call-id": ["tool-call-456"],
            "x-tools-count": ["3"],
            "x-identifiers-count": ["5"],
            "x-messages-count": ["7"],
          };
          return values[key] || [];
        },
      };

      const span = tracer.startSpan("test-operation", { kind: "INTERNAL" });

      // Capture setAttribute calls
      const setAttributeCalls = [];
      const originalSetAttribute = span.setAttribute.bind(span);
      span.setAttribute = (key, value) => {
        setAttributeCalls.push({ key, value });
        return originalSetAttribute(key, value);
      };

      tracer.getMetadata(metadata, span);

      // Verify trace context
      assert.strictEqual(span.traceId, "test-trace-id");
      assert.strictEqual(span.parentSpanId, "test-parent-span-id");

      // Verify string attributes were set
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.resource_id" && c.value === "resource-123",
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) =>
            c.key === "request.tool_call_id" && c.value === "tool-call-456",
        ),
      );

      // Verify count attributes were set (as integers)
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.tools" && c.value === 3,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.identifiers" && c.value === 5,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.messages" && c.value === 7,
        ),
      );
    });

    test("getMetadata handles missing optional attributes gracefully", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      // Mock metadata with only trace context, no request attributes
      const metadata = {
        get: (key) => {
          if (key === "x-trace-id") return ["test-trace-id"];
          if (key === "x-span-id") return ["test-parent-span-id"];
          return [];
        },
      };

      const span = tracer.startSpan("test-operation", { kind: "INTERNAL" });

      // Capture setAttribute calls
      const setAttributeCalls = [];
      const originalSetAttribute = span.setAttribute.bind(span);
      span.setAttribute = (key, value) => {
        setAttributeCalls.push({ key, value });
        return originalSetAttribute(key, value);
      };

      tracer.getMetadata(metadata, span);

      // Verify trace context was extracted
      assert.strictEqual(span.traceId, "test-trace-id");
      assert.strictEqual(span.parentSpanId, "test-parent-span-id");

      // Verify no request attributes were set
      assert.ok(!setAttributeCalls.find((c) => c.key.startsWith("request.")));
    });

    test("setMetadata populates string and count attributes in metadata", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      // Mock gRPC metadata
      const metadataMap = {};
      const metadata = {
        set: (key, value) => {
          metadataMap[key] = value;
        },
      };

      // Create request with various attributes
      const request = {
        resource_id: "resource-789",
        tool_call_id: "tool-call-012",
        tools: [{ name: "tool1" }, { name: "tool2" }],
        identifiers: ["id1", "id2", "id3", "id4"],
        messages: [{ role: "user" }, { role: "assistant" }, { role: "user" }],
      };

      const span = tracer.startSpan("test-operation", { kind: "CLIENT" });

      // Capture setAttribute calls
      const setAttributeCalls = [];
      const originalSetAttribute = span.setAttribute.bind(span);
      span.setAttribute = (key, value) => {
        setAttributeCalls.push({ key, value });
        return originalSetAttribute(key, value);
      };

      tracer.setMetadata(metadata, span, request);

      // Verify trace context was set
      assert.strictEqual(metadataMap["x-trace-id"], span.traceId);
      assert.strictEqual(metadataMap["x-span-id"], span.spanId);

      // Verify string attributes were set
      assert.strictEqual(metadataMap["x-resource-id"], "resource-789");
      assert.strictEqual(metadataMap["x-tool-call-id"], "tool-call-012");

      // Verify count attributes were set (as strings in metadata)
      assert.strictEqual(metadataMap["x-tools-count"], "2");
      assert.strictEqual(metadataMap["x-identifiers-count"], "4");
      assert.strictEqual(metadataMap["x-messages-count"], "3");

      // Verify attributes were also set on span (as numbers for counts)
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.resource_id" && c.value === "resource-789",
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) =>
            c.key === "request.tool_call_id" && c.value === "tool-call-012",
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.tools" && c.value === 2,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.identifiers" && c.value === 4,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.messages" && c.value === 3,
        ),
      );
    });

    test("setMetadata handles empty arrays as zero counts", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      const metadataMap = {};
      const metadata = {
        set: (key, value) => {
          metadataMap[key] = value;
        },
      };

      // Request with empty arrays
      const request = {
        tools: [],
        identifiers: [],
        messages: [],
      };

      const span = tracer.startSpan("test-operation", { kind: "CLIENT" });

      // Capture setAttribute calls
      const setAttributeCalls = [];
      const originalSetAttribute = span.setAttribute.bind(span);
      span.setAttribute = (key, value) => {
        setAttributeCalls.push({ key, value });
        return originalSetAttribute(key, value);
      };

      tracer.setMetadata(metadata, span, request);

      // Verify empty arrays result in zero counts
      assert.strictEqual(metadataMap["x-tools-count"], "0");
      assert.strictEqual(metadataMap["x-identifiers-count"], "0");
      assert.strictEqual(metadataMap["x-messages-count"], "0");

      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.tools" && c.value === 0,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.identifiers" && c.value === 0,
        ),
      );
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.messages" && c.value === 0,
        ),
      );
    });

    test("setMetadata skips undefined and null request attributes", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      const metadataMap = {};
      const metadata = {
        set: (key, value) => {
          metadataMap[key] = value;
        },
      };

      // Request with some undefined/null values
      const request = {
        resource_id: "resource-123",
        tool_call_id: null,
        tools: undefined,
        identifiers: ["id1"],
        messages: null,
      };

      const span = tracer.startSpan("test-operation", { kind: "CLIENT" });

      // Capture setAttribute calls
      const setAttributeCalls = [];
      const originalSetAttribute = span.setAttribute.bind(span);
      span.setAttribute = (key, value) => {
        setAttributeCalls.push({ key, value });
        return originalSetAttribute(key, value);
      };

      tracer.setMetadata(metadata, span, request);

      // Verify only defined values were set
      assert.strictEqual(metadataMap["x-resource-id"], "resource-123");
      assert.strictEqual(metadataMap["x-tool-call-id"], undefined);
      assert.strictEqual(metadataMap["x-tools-count"], undefined);
      assert.strictEqual(metadataMap["x-identifiers-count"], "1");
      assert.strictEqual(metadataMap["x-messages-count"], undefined);

      // Verify span attributes
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.resource_id" && c.value === "resource-123",
        ),
      );
      assert.ok(
        !setAttributeCalls.find((c) => c.key === "request.tool_call_id"),
      );
      assert.ok(!setAttributeCalls.find((c) => c.key === "request.tools"));
      assert.ok(
        setAttributeCalls.find(
          (c) => c.key === "request.identifiers" && c.value === 1,
        ),
      );
      assert.ok(!setAttributeCalls.find((c) => c.key === "request.messages"));
    });

    test("setMetadata works when no request is provided", () => {
      const mockTraceClient = { RecordSpan: () => Promise.resolve() };
      const tracer = new Tracer({
        serviceName: "test-service",
        traceClient: mockTraceClient,
      });

      const metadataMap = {};
      const metadata = {
        set: (key, value) => {
          metadataMap[key] = value;
        },
      };

      const span = tracer.startSpan("test-operation", { kind: "CLIENT" });
      tracer.setMetadata(metadata, span, null);

      // Verify only trace context was set, no request attributes
      assert.strictEqual(metadataMap["x-trace-id"], span.traceId);
      assert.strictEqual(metadataMap["x-span-id"], span.spanId);
      assert.strictEqual(metadataMap["x-resource-id"], undefined);
      assert.strictEqual(metadataMap["x-tools-count"], undefined);
    });
  });
});
