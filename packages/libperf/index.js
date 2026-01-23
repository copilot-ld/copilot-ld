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
   * @param {string} unit - Unit of measurement (e.g., "items", "queries")
   * @param {number} duration - Execution time in milliseconds
   * @param {number} memory - Memory usage change in KB
   */
  constructor(count, unit, duration, memory) {
    this.count = count;
    this.unit = unit;
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
    let result = this.unit ? `${this.count} ${this.unit}` : `${this.count}`;

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
  #unit = null;

  /**
   * Reset the monitor for reuse
   */
  reset() {
    this.#initialMemory = null;
    this.#startTime = null;
    this.#count = null;
    this.#unit = null;
  }

  /**
   * Start monitoring performance
   * @param {number} count - Count for scaling tests
   * @param {string} unit - Unit of measurement (e.g., "items", "queries")
   */
  start(count, unit) {
    this.#count = count;
    this.#unit = unit;
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
    return new PerformanceMetric(this.#count, this.#unit, duration, memory);
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
 * @param {(count: number) => any} config.setupFn - Function that takes count and returns dependencies
 * @param {(dependencies: any) => any} config.testFn - Function to test (receives setupFn result)
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

        // Run 25 warmup calls to ensure JIT compilation stabilizes
        for (let warmupCall = 0; warmupCall < 25; warmupCall++) {
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
  // Check if gc is available (requires --expose-gc flag)
  if (typeof global.gc !== "function") {
    // In development/CI environments without --expose-gc, skip GC
    // This will still run tests but with less isolation
    return;
  }

  // Run GC multiple times to ensure memory is fully stabilized
  // Young generation objects may need multiple GC cycles
  for (let i = 0; i < 5; i++) {
    global.gc();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Measure performance of an async function with automatic test isolation
 * Runs multiple measurements, filters outliers using IQR, and takes median
 * @param {number} count - Count for scaling tests
 * @param {Function} fn - Async function to measure
 * @param {number} [runs] - Number of measurement runs (default: 8)
 * @returns {Promise<PerformanceMetric>} Performance metrics (median by duration)
 */
export async function measurePerformance(count, fn, runs = 8) {
  const measurements = [];

  for (let i = 0; i < runs; i++) {
    await isolatePerformanceTest();
    const monitor = new PerformanceMonitor();
    monitor.start(count);
    await fn();
    measurements.push(monitor.stop());
  }

  // Filter outliers using IQR method, then take median
  const filtered = filterOutliers(measurements);
  filtered.sort((a, b) => a.duration - b.duration);
  return filtered[Math.floor(filtered.length / 2)];
}

/**
 * Filter outliers from measurements using the IQR method
 * @param {PerformanceMetric[]} measurements - Array of measurements
 * @returns {PerformanceMetric[]} Filtered measurements with outliers removed
 */
function filterOutliers(measurements) {
  if (measurements.length < 4) return measurements;

  const durations = measurements.map((m) => m.duration).sort((a, b) => a - b);
  const q1 = durations[Math.floor(durations.length * 0.25)];
  const q3 = durations[Math.floor(durations.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const filtered = measurements.filter(
    (m) => m.duration >= lowerBound && m.duration <= upperBound,
  );

  // Return at least half of measurements to avoid over-filtering
  return filtered.length >= measurements.length / 2 ? filtered : measurements;
}
