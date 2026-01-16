import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import {
  PerformanceMetric,
  PerformanceMonitor,
  ScalingMetric,
  assertPerformance,
  assertScaling,
  createPerformanceTest,
  createScalingMetrics,
  isolatePerformanceTest,
  measurePerformance,
} from "../index.js";

describe("libperf", () => {
  beforeEach(() => {
    // Mock global.gc if not available for all tests
    if (typeof global.gc !== "function") {
      global.gc = () => {};
    }
  });

  describe("PerformanceMetric", () => {
    test("creates metric with count, duration, and memory", () => {
      const metric = new PerformanceMetric(100, "items", 50.5, 1024);

      assert.strictEqual(metric.count, 100);
      assert.strictEqual(metric.unit, "items");
      assert.strictEqual(metric.duration, 50.5);
      assert.strictEqual(metric.memory, 1024);
    });

    test("getViolations returns empty array when no constraints violated", () => {
      const metric = new PerformanceMetric(100, "items", 50, 1000);
      const constraints = { maxDuration: 100, maxMemory: 2000 };

      const violations = metric.getViolations(constraints);
      assert.strictEqual(violations.length, 0);
    });

    test("getViolations returns duration violation", () => {
      const metric = new PerformanceMetric(100, "items", 150, 1000);
      const constraints = { maxDuration: 100 };

      const violations = metric.getViolations(constraints);
      assert.strictEqual(violations.length, 1);
      assert(violations[0].includes("Duration"));
      assert(violations[0].includes("150.00ms"));
      assert(violations[0].includes("100ms"));
    });

    test("getViolations returns memory violation", () => {
      const metric = new PerformanceMetric(100, "items", 50, 3000);
      const constraints = { maxMemory: 2000 };

      const violations = metric.getViolations(constraints);
      assert.strictEqual(violations.length, 1);
      assert(violations[0].includes("Memory"));
      assert(violations[0].includes("3000KB"));
      assert(violations[0].includes("2000KB"));
    });

    test("getDiagnostics returns formatted string without constraints", () => {
      const metric = new PerformanceMetric(100, "items", 50.123, 1024.567);

      const diagnostics = metric.getDiagnostics();
      assert.strictEqual(diagnostics, "100 items | 50ms | 1025KB");
    });

    test("getDiagnostics includes percentages with constraints", () => {
      const metric = new PerformanceMetric(100, "items", 50, 1000);
      const constraints = { maxDuration: 100, maxMemory: 2000 };

      const diagnostics = metric.getDiagnostics(constraints);
      assert(diagnostics.includes("(50%)"));
      assert(diagnostics.includes("50ms"));
      assert(diagnostics.includes("1000KB"));
    });
  });

  describe("PerformanceMonitor", () => {
    let monitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    test("creates monitor instance", () => {
      assert.ok(monitor instanceof PerformanceMonitor);
    });

    test("start and stop tracking performance", async () => {
      monitor.start(100, "items");

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 1));

      const metric = monitor.stop();

      assert.ok(metric instanceof PerformanceMetric);
      assert.strictEqual(metric.count, 100);
      assert.strictEqual(metric.unit, "items");
      assert(metric.duration >= 0); // Allow 0 for very fast operations
      assert.strictEqual(typeof metric.memory, "number");
    });

    test("throws error when stopping without starting", () => {
      assert.throws(() => monitor.stop(), { message: /Monitor not started/ });
    });

    test("reset clears monitor state", () => {
      monitor.start(100, "items");
      monitor.reset();

      assert.throws(() => monitor.stop(), { message: /Monitor not started/ });
    });
  });

  describe("ScalingMetric", () => {
    test("creates scaling metric with ratios", () => {
      const metric = new ScalingMetric(100, 200, 2.0, 1.8, 2.1);

      assert.strictEqual(metric.prevCount, 100);
      assert.strictEqual(metric.currCount, 200);
      assert.strictEqual(metric.countRatio, 2.0);
      assert.strictEqual(metric.durationRatio, 1.8);
      assert.strictEqual(metric.memoryRatio, 2.1);
    });

    test("getViolations returns empty for acceptable scaling", () => {
      const metric = new ScalingMetric(100, 200, 2.0, 1.5, 1.8);
      const constraints = { scaling: "linear", tolerance: 2.0 };

      const violations = metric.getViolations(constraints);
      assert.strictEqual(violations.length, 0);
    });

    test("getViolations reports duration scaling violation", () => {
      const metric = new ScalingMetric(100, 200, 2.0, 5.0, 1.8);
      const constraints = { scaling: "linear", tolerance: 2.0 };

      const violations = metric.getViolations(constraints);
      assert.strictEqual(violations.length, 1);
      assert(violations[0].includes("Duration"));
      assert(violations[0].includes("linear scaling violated"));
    });

    test("getDiagnostics returns formatted scaling info", () => {
      const metric = new ScalingMetric(100, 200, 2.0, 1.8, 2.1);

      const diagnostics = metric.getDiagnostics({ tolerance: 2.0 });
      assert(diagnostics.includes("100→200"));
      assert(diagnostics.includes("1.8x ms"));
      assert(diagnostics.includes("2.1x KB"));
    });
  });

  describe("assertPerformance", () => {
    test("passes for metric within constraints", () => {
      const metric = new PerformanceMetric(100, "items", 50, 1000);
      const constraints = { maxDuration: 100, maxMemory: 2000 };

      // Should not throw
      assertPerformance(metric, constraints);
    });

    test("throws for metric exceeding constraints", () => {
      const metric = new PerformanceMetric(100, "items", 150, 1000);
      const constraints = { maxDuration: 100 };

      assert.throws(() => assertPerformance(metric, constraints), {
        message: /Performance violations/,
      });
    });

    test("throws when no constraints provided", () => {
      const metric = new PerformanceMetric(100, "items", 50, 1000);

      assert.throws(() => assertPerformance(metric, {}), {
        message: /Either maxDuration or maxMemory constraints are required/,
      });
    });
  });

  describe("assertScaling", () => {
    test("passes for acceptable scaling metrics", () => {
      const metrics = [new ScalingMetric(100, 200, 2.0, 1.8, 1.9)];
      const constraints = { scaling: "linear", tolerance: 2.0 };

      // Should not throw
      assertScaling(metrics, constraints);
    });

    test("throws for poor scaling metrics", () => {
      const metrics = [new ScalingMetric(100, 200, 2.0, 5.0, 1.9)];
      const constraints = { scaling: "linear", tolerance: 2.0 };

      assert.throws(() => assertScaling(metrics, constraints), {
        message: /Scaling violations/,
      });
    });

    test("throws when no constraints provided", () => {
      const metrics = [new ScalingMetric(100, 200, 2.0, 1.8, 1.9)];

      assert.throws(() => assertScaling(metrics, {}), {
        message: /Either scaling or tolerance constraints are required/,
      });
    });
  });

  describe("createScalingMetrics", () => {
    test("creates scaling metrics from performance metrics", () => {
      const performanceMetrics = [
        new PerformanceMetric(100, "items", 50, 1000),
        new PerformanceMetric(200, "items", 90, 1800),
        new PerformanceMetric(400, "items", 180, 3600),
      ];

      const scalingMetrics = createScalingMetrics(performanceMetrics);

      assert.strictEqual(scalingMetrics.length, 2);

      const first = scalingMetrics[0];
      assert.strictEqual(first.prevCount, 100);
      assert.strictEqual(first.currCount, 200);
      assert.strictEqual(first.countRatio, 2.0);

      const second = scalingMetrics[1];
      assert.strictEqual(second.prevCount, 200);
      assert.strictEqual(second.currCount, 400);
      assert.strictEqual(second.countRatio, 2.0);
    });

    test("filters out metrics without count", () => {
      const performanceMetrics = [
        new PerformanceMetric(0, "items", 50, 1000), // count is 0
        new PerformanceMetric(100, "items", 90, 1800),
      ];

      const scalingMetrics = createScalingMetrics(performanceMetrics);
      assert.strictEqual(scalingMetrics.length, 0);
    });
  });

  describe("measurePerformance", () => {
    test("measures performance of async function", async () => {
      const testFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result";
      };

      const metric = await measurePerformance(100, testFn);

      assert.ok(metric instanceof PerformanceMetric);
      assert.strictEqual(metric.count, 100);
      assert(metric.duration > 0);
      assert.strictEqual(typeof metric.memory, "number");
    });

    test("handles function that throws error", async () => {
      const testFn = async () => {
        throw new Error("Test error");
      };

      await assert.rejects(() => measurePerformance(100, testFn), {
        message: /Test error/,
      });
    });
  });

  describe("isolatePerformanceTest", () => {
    test("runs without error", async () => {
      // Should not throw
      await isolatePerformanceTest();
    });
  });

  describe("createPerformanceTest", () => {
    test("creates test function for single count", () => {
      const testConfig = {
        count: 100,
        setupFn: async (count) => ({ data: `test-${count}` }),
        testFn: async ({ data }) => data.toUpperCase(),
        constraints: { maxDuration: 1000, maxMemory: 5000 },
      };

      const testFunction = createPerformanceTest(testConfig);
      assert.strictEqual(typeof testFunction, "function");
    });

    test("creates test function for multiple counts (scaling)", () => {
      const testConfig = {
        count: [100, 200, 400],
        setupFn: async (count) => ({ items: new Array(count).fill("test") }),
        testFn: async ({ items }) => items.join(""),
        constraints: {
          maxDuration: 1000,
          maxMemory: 10000,
          scaling: "linear",
          tolerance: 2.0,
        },
      };

      const testFunction = createPerformanceTest(testConfig);
      assert.strictEqual(typeof testFunction, "function");
    });
  });
});
