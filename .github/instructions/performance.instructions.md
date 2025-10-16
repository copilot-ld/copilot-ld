---
applyTo: "**/*.perf.js"
---

# Performance Instructions

## Purpose Declaration

This file defines comprehensive performance testing standards for JavaScript
performance test files using the `@copilot-ld/libperf` performance testing
library to ensure consistent performance validation across all packages in this
project's codebase.

## Core Principles

1. **Separate Performance Tests**: Performance tests must be isolated from unit
   tests in dedicated `*.perf.js` files
2. **Library Standardization**: Use only the `@copilot-ld/libperf` performance
   testing library for all performance tests
3. **Memory Measurement Accuracy**: Always run performance tests with
   `--expose-gc` flag for accurate memory measurements
4. **Realistic Constraints**: Use constraints based on actual usage patterns and
   CI environment performance characteristics
5. **Comprehensive Coverage**: Test scaling behavior, absolute performance
   limits, and memory stability for all performance-critical components

## Implementation Requirements

### Required Execution Command

Performance tests must be executed with garbage collection exposed:

```bash
node --expose-gc --test packages/*/test/*.perf.js
```

### Test File Organization

Performance tests must be in separate files with `.perf.js` extension:

```
packages/libvector/test/
├── libvector.test.js       # Unit tests
└── libvector.perf.js       # Performance tests
```

### Required Import Pattern

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";

// Component under test
import { ComponentName } from "../index.js";

// Test utilities
import { createDependencies, generateTestData } from "./helpers/perf.js";

// Helper functions
function generateRandomVector() {
  return Array.from({ length: 384 }, () => Math.random());
}

// Mock class for testing
class VectorIndex {
  constructor() {
    this.vectors = new Map();
  }

  async addItem(id, vector) {
    this.vectors.set(id, vector);
  }
}
```

### Test Creation Syntax

All performance tests must use the `createPerformanceTest` function:

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";
import { ComponentName } from "../index.js";
import { createDependencies } from "./helpers/perf.js";

test(
  "ComponentName.method performance",
  createPerformanceTest({
    count: 50,
    setupFn: async (count) => {
      // Setup code
    },
    testFn: async (context) => {
      // Performance test code
    },
    constraints: {
      maxDuration: 350,
      maxMemory: 1500,
    },
  }),
);
```

## Best Practices

### Test Type Classifications

#### 1. Scaling Tests

Test algorithmic performance across multiple input sizes:

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";
import { ComponentName } from "../index.js";
import { createDependencies } from "./helpers/perf.js";

test(
  "ComponentName.method",
  createPerformanceTest({
    count: [100, 500, 1000, 2000], // Array for scaling analysis
    setupFn: (count) => createDependencies(count),
    testFn: ({ dependency }) => {
      const instance = new ComponentName(dependency);
      instance.method();
    },
    constraints: {
      maxDuration: 500,
      maxMemory: 50000,
      scaling: "linear",
      tolerance: 2.0,
    },
  }),
);
```

**Required characteristics:**

- Array of count values for scaling analysis
- Must include `scaling` and `tolerance` constraints
- Test name must include "scaling"

#### 2. Single Performance Tests

Test absolute performance limits:

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";
import { createDependencies } from "./helpers/perf.js";

class VectorIndex {
  constructor(storage) {
    this.storage = storage;
  }
  async loadData() {}
  async queryItems(query, threshold, limit) {}
}

function generateRandomVector(size) {
  return Array.from({ length: size }, () => Math.random());
}

test(
  "VectorIndex.queryItems",
  createPerformanceTest({
    count: 50,
    setupFn: async (count) => {
      const { mockStorage } = createDependencies(1000, 1024);
      const index = new VectorIndex(mockStorage);
      await index.loadData();
      return { index, query: generateRandomVector(1024) };
    },
    testFn: async ({ index, query }) => {
      await index.queryItems(query, 0.3, 10);
    },
    constraints: {
      maxDuration: 350,
      maxMemory: 1500,
    },
  }),
);
```

**Required characteristics:**

- Single count value
- Must include `maxDuration` or `maxMemory` constraints

#### 3. Memory Stability Tests

Test for memory leaks through repeated operations:

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";
import { createDependencies } from "./helpers/perf.js";

class VectorIndex {
  constructor(storage) {
    this.storage = storage;
  }
  async loadData() {}
  async queryItems(query, threshold, limit) {}
}

function generateRandomVector(size) {
  return Array.from({ length: size }, () => Math.random());
}

test(
  "VectorIndex.queryItems memory stability",
  createPerformanceTest({
    count: 1000,
    setupFn: async (iterations) => {
      const { mockStorage } = createDependencies(1000, 1024);
      const index = new VectorIndex(mockStorage);
      await index.loadData();
      return { index, query: generateRandomVector(1024), iterations };
    },
    testFn: async ({ index, query, iterations }) => {
      for (let i = 0; i < iterations; i++) {
        await index.queryItems(query, 0.3, 10);
      }
    },
    constraints: {
      maxMemory: 1750,
    },
  }),
);
```

**Required characteristics:**

- Higher count values (typically 1000+)
- **Only use `maxMemory` constraint** (no maxDuration)
- Test name must include "memory stability"

### Naming Convention Requirements

- **Scaling tests**: `"ComponentName.method scaling"`
- **Performance tests**: `"ComponentName.method performance"`
- **Memory stability tests**: `"ComponentName.method memory stability"`

## Explicit Prohibitions

### Forbidden Performance Testing Practices

1. **DO NOT** mix performance tests with unit tests in the same file
2. **DO NOT** run performance tests without the `--expose-gc` flag
3. **DO NOT** use external performance testing libraries other than
   `@copilot-ld/libperf`
4. **DO NOT** set unrealistic constraints that don't reflect actual usage
5. **DO NOT** use both `maxDuration` and other constraints in memory stability
   tests
6. **DO NOT** create scaling tests without `scaling` and `tolerance` constraints
7. **DO NOT** commit performance tests that consistently fail in CI environment

### Alternative Approaches

- Instead of mixing tests → Separate `.perf.js` files for performance tests
- Instead of unrealistic constraints → Use guidelines based on operation
  complexity
- Instead of external libraries → Use `@copilot-ld/libperf` exclusively
- Instead of missing constraints → Follow constraint guidelines for each test
  type

## Comprehensive Examples

### Complete Scaling Test Example

```javascript
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";
import { VectorIndex } from "../index.js";
import { createDependencies, generateRandomVector } from "./helpers/perf.js";

test(
  "VectorIndex.addItem scaling",
  createPerformanceTest({
    count: [100, 300, 500, 1000],
    setupFn: async (count) => {
      const { mockStorage } = createDependencies(0, 1024);
      const index = new VectorIndex(mockStorage);
      const vectors = Array.from({ length: count }, (_, i) => ({
        id: `vector-${i}`,
        embedding: generateRandomVector(1024),
        metadata: { source: `test-${i}` },
      }));
      return { index, vectors };
    },
    testFn: async ({ index, vectors }) => {
      for (const vector of vectors) {
        await index.addItem(vector.id, vector.embedding, vector.metadata);
      }
    },
    constraints: {
      maxDuration: 800,
      maxMemory: 25000,
      scaling: "linear",
      tolerance: 2.5,
    },
  }),
);
```

### Performance Helper Utilities

```javascript
// ./test/helpers/perf.js
export function createDependencies(vectorCount, dimensions) {
  const vectors = Array.from({ length: vectorCount }, (_, i) => ({
    id: `perf-vector-${i}`,
    embedding: generateRandomVector(dimensions),
    metadata: { category: `cat-${i % 10}`, score: Math.random() },
  }));

  return {
    mockStorage: {
      query: async (embedding, threshold, limit) => {
        return vectors
          .map((v) => ({ ...v, score: Math.random() }))
          .filter((v) => v.score >= threshold)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
    },
    testVectors: vectors,
  };
}

export function generateRandomVector(dimensions) {
  const vector = Array.from({ length: dimensions }, () => Math.random() - 0.5);
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => val / magnitude);
}
```

### Performance Constraint Guidelines

Choose appropriate constraints based on operation complexity:

#### Quick Operations (< 100ms expected)

- **maxDuration**: 150-250ms
- **maxMemory**: 500-1000KB
- Examples: Array filtering, simple calculations, cache lookups

#### Medium Operations (100-300ms expected)

- **maxDuration**: 300-500ms
- **maxMemory**: 1000-2000KB
- Examples: Vector queries, data transformations, file parsing

#### Heavy Operations (300ms+ expected)

- **maxDuration**: 500-1000ms
- **maxMemory**: 2000-5000KB
- Examples: Large dataset processing, complex computations, batch operations

#### Memory Stability Tests

- **maxMemory only**: Set 20-30% above baseline to catch leaks
- **High iteration count**: 1000+ iterations to expose gradual leaks
- Examples: Repeated queries, long-running processes, cache operations
