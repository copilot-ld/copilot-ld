/* eslint-env node */
import { performance } from "node:perf_hooks";
import { memoryUsage } from "node:process";

/**
 * @typedef {object} Constraints
 * @property {number} [maxDuration] - Maximum allowed duration in milliseconds
 * @property {number} [maxMemory] - Maximum allowed memory increase in KB
 * @property {string} [scaling] - Scaling type: 'linear' or 'sublinear'
 * @property {number} [tolerance] - Scaling tolerance (default: 2.0)
 */

/**
 * Performance metrics container
 */
export class PerformanceMetric {
  /**
   * Create performance metrics
   * @param {number} count - Count parameter for scaling tests
   * @param {number} duration - Execution time in milliseconds
   * @param {number} memory - Memory usage change in KB
   */
  constructor(count, duration, memory) {
    this.count = count;
    this.duration = duration;
    this.memory = memory;
  }

  /**
   * Check if metrics violate constraints and return violation messages
   * @param {Constraints} constraints - Performance constraints
   * @returns {string[]} Array of violation messages
   */
  getViolations({ maxDuration, maxMemory } = {}) {
    const violations = [];

    if (maxDuration !== undefined && this.duration > maxDuration) {
      violations.push(
        `Duration of ${this.duration.toFixed(2)}ms exceeds maximum ${maxDuration}ms`,
      );
    }

    if (maxMemory !== undefined && this.memory > maxMemory) {
      violations.push(
        `Memory increase of ${this.memory.toFixed(0)}KB exceeds maximum ${maxMemory}KB`,
      );
    }

    return violations;
  }

  /**
   * Get diagnostic string with optional constraint comparison
   * @param {Constraints} constraints - Performance constraints
   * @returns {string} Formatted string with constraint analysis
   */
  getDiagnostics({ maxDuration, maxMemory } = {}) {
    let result = `${this.count}`;

    // Duration with percentage if constraint provided
    const durationPct = maxDuration
      ? ` (${Math.round((this.duration / maxDuration) * 100)}%)`
      : "";
    result += ` | ${this.duration.toFixed(0)}ms${durationPct}`;

    // Memory with percentage if constraint provided
    const memoryPct = maxMemory
      ? ` (${Math.round((this.memory / maxMemory) * 100)}%)`
      : "";
    result += ` | ${this.memory.toFixed(0)}KB${memoryPct}`;

    return result;
  }
}

/**
 * Performance monitor for tracking execution metrics
 */
export class PerformanceMonitor {
  #initialMemory = null;
  #startTime = null;
  #count = null;

  /**
   * Reset the monitor for reuse
   */
  reset() {
    this.#initialMemory = null;
    this.#startTime = null;
    this.#count = null;
  }

  /**
   * Start monitoring performance
   * @param {number} count - Count for scaling tests
   */
  start(count) {
    this.#count = count;
    isolatePerformanceTest();
    this.#initialMemory = memoryUsage().heapUsed;
    this.#startTime = performance.now();
  }

  /**
   * Stop monitoring and return metrics
   * @returns {PerformanceMetric} Performance metrics
   */
  stop() {
    if (!this.#startTime) throw new Error("Monitor not started.");
    const duration = performance.now() - this.#startTime;
    const memory = (memoryUsage().heapUsed - this.#initialMemory) / 1024;
    return new PerformanceMetric(this.#count, duration, memory);
  }
}

/**
 * Scaling metrics container for performance comparisons
 */
export class ScalingMetric {
  /**
   * Create scaling metrics
   * @param {number} prevCount - Previous count value
   * @param {number} currCount - Current count value
   * @param {number} countRatio - Count scaling ratio
   * @param {number} durationRatio - Duration scaling ratio
   * @param {number} memoryRatio - Memory scaling ratio
   */
  constructor(prevCount, currCount, countRatio, durationRatio, memoryRatio) {
    this.prevCount = prevCount;
    this.currCount = currCount;
    this.countRatio = countRatio;
    this.durationRatio = durationRatio;
    this.memoryRatio = memoryRatio;
  }

  /**
   * Check if scaling violates constraints
   * @param {Constraints} constraints - Performance constraints
   * @returns {string[]} Array of violation messages
   */
  getViolations({ scaling = "linear", tolerance = 2.0 } = {}) {
    const violations = [];
    const expectedRatio = this.countRatio * tolerance;

    const checkRatio = (ratio, label) => {
      if (ratio > expectedRatio) {
        const condition = scaling === "linear" ? "tolerance" : "max factor";
        violations.push(
          `${label} ${scaling} scaling violated: ${ratio.toFixed(2)}x for ${this.countRatio.toFixed(2)}x count increase (${condition}: ${tolerance}x)`,
        );
      }
    };

    checkRatio(this.durationRatio, "Duration");
    checkRatio(this.memoryRatio, "Memory");

    return violations;
  }

  /**
   * Get diagnostic string with optional constraint analysis
   * @param {Constraints} constraints - Performance constraints
   * @returns {string} Formatted string with scaling analysis
   */
  getDiagnostics({ tolerance = 2.0 } = {}) {
    const expected = this.countRatio * tolerance;
    let result = `${this.prevCount}→${this.currCount}`;

    // Duration with percentage if tolerance provided
    const durationPct = tolerance
      ? ` (${Math.round((this.durationRatio / expected) * 100)}%)`
      : "";
    result += ` | ${this.durationRatio.toFixed(1)}x ms${durationPct}`;

    // Memory with percentage if tolerance provided
    const memoryPct = tolerance
      ? ` (${Math.round((this.memoryRatio / expected) * 100)}%)`
      : "";
    result += ` | ${this.memoryRatio.toFixed(1)}x KB${memoryPct}`;

    return result;
  }
}

/**
 * Assert that performance metrics meet constraints
 * @param {PerformanceMetric} performanceMetric - Metric to check
 * @param {Constraints} constraints - Performance constraints
 * @throws {Error} If constraints are violated
 */
export function assertPerformance(performanceMetric, constraints) {
  if (!constraints.maxDuration && !constraints.maxMemory) {
    throw new Error("Either maxDuration or maxMemory constraints are required");
  }

  const violations = performanceMetric.getViolations(constraints);

  if (violations.length > 0) {
    throw new Error(`Performance violations:\n${violations.join("\n")}`);
  }
}

/**
 * Assert scaling performance based on constraints
 * @param {ScalingMetric[]} scalingMetrics - Array of scaling metrics
 * @param {Constraints} [constraints] - Performance constraints
 * @throws {Error} If scaling constraints are violated
 */
export function assertScaling(scalingMetrics, constraints = {}) {
  if (!constraints.scaling && !constraints.tolerance) {
    throw new Error("Either scaling or tolerance constraints are required");
  }

  const violations = scalingMetrics.flatMap((scalingMetric) =>
    scalingMetric.getViolations(constraints),
  );

  if (violations.length > 0) {
    throw new Error(`Scaling violations:\n${violations.join("\n")}`);
  }
}

/**
 * Creates performance tests for methods or functions
 * @param {object} config - Test configuration
 * @param {number|number[]} config.count - Count(s) to test
 * @param {Function} config.setupFn - Function that takes count and returns dependencies
 * @param {Function} config.testFn - Function to test (receives setupFn result)
 * @param {Constraints} [config.constraints] - Performance constraints
 * @returns {Function} Test function for node:test
 */
export function createPerformanceTest(config) {
  const { count, setupFn, testFn, constraints } = config;

  const counts = Array.isArray(count) ? count : [count];
  const isScalingTest = counts.length > 1;

  return async (t) => {
    const performanceMetrics = [];

    // Set up test isolation for all performance tests
    t.beforeEach(isolatePerformanceTest);

    // Run test for each count
    await t.test(`${t.name} performs well`, async (subTest) => {
      for (let i = 0; i < counts.length; i++) {
        const currentCount = counts[i];
        const isLastCount = i === counts.length - 1;

        const dependencies = await setupFn(currentCount);

        // Run 10 warmup calls to reduce flakiness
        for (let warmupCall = 0; warmupCall < 10; warmupCall++) {
          await testFn(dependencies);
        }

        // Clean up after warmup to ensure accurate performance measurement
        await isolatePerformanceTest();

        const performanceMetric = await measurePerformance(
          currentCount,
          async () => testFn(dependencies),
        );

        performanceMetrics.push(performanceMetric);

        // Only assert performance for single count tests or the last count in array tests
        if (!isScalingTest || isLastCount) {
          subTest.diagnostic(performanceMetric.getDiagnostics(constraints));
          assertPerformance(performanceMetric, constraints);
        }
      }
    });

    // Assert scaling for multi-count tests
    if (isScalingTest) {
      await t.test(`${t.name} scales well`, (subTest) => {
        const scalingMetrics = createScalingMetrics(performanceMetrics);

        for (const scalingMetric of scalingMetrics) {
          subTest.diagnostic(scalingMetric.getDiagnostics(constraints));
        }

        assertScaling(scalingMetrics, constraints);
      });
    }
  };
}

/**
 * Create scaling metrics for performance comparisons
 * @param {PerformanceMetric[]} performanceMetrics - Array of metrics with count property
 * @returns {ScalingMetric[]} Array of scaling metrics
 */
export function createScalingMetrics(performanceMetrics) {
  const sortedMetrics = performanceMetrics
    .filter((m) => m.count)
    .sort((a, b) => a.count - b.count);

  return sortedMetrics.slice(1).map((curr, i) => {
    const prev = sortedMetrics[i];
    return new ScalingMetric(
      prev.count,
      curr.count,
      curr.count / prev.count,
      curr.duration / prev.duration,
      curr.memory / prev.memory,
    );
  });
}

/**
 * Performs test isolation by running garbage collection and waiting
 * @returns {Promise<void>} Promise that resolves after cleanup
 */
export async function isolatePerformanceTest() {
  global.gc();
  await new Promise((resolve) => setTimeout(resolve, 10));
}

/**
 * Measure performance of an async function with automatic test isolation
 * @param {number} count - Count for scaling tests
 * @param {Function} fn - Async function to measure
 * @returns {Promise<PerformanceMetric>} Performance metrics
 */
export async function measurePerformance(count, fn) {
  const monitor = new PerformanceMonitor();
  monitor.start(count);

  try {
    await fn();
    return monitor.stop();
  } catch (error) {
    monitor.stop();
    throw error;
  }
}
