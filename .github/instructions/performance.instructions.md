---
applyTo: "**/*.perf.js"
---

# Performance Instructions

Performance tests use `@copilot-ld/libperf` in separate `*.perf.js` files to
validate algorithmic complexity, absolute performance, and memory stability.

## Principles

1. **Isolation**: Performance tests live in `*.perf.js`, never mixed with unit
   tests
2. **GC Required**: Run with `node --expose-gc` for accurate memory measurement
3. **Realistic Constraints**: Base limits on actual usage, not arbitrary values
4. **Three Test Types**: Scaling (algorithmic), single (absolute), memory
   stability (leak detection)

## Requirements

### Execution

```bash
node --expose-gc --test packages/*/test/*.perf.js
```

### Test Structure

```javascript
import { test, describe } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";

describe("Component Performance Tests", () => {
  test(
    "Component.method performance",
    createPerformanceTest({
      count: 50,
      setupFn: async (count) => ({ data: createTestData(count) }),
      testFn: async ({ data }) => component.process(data),
      constraints: { maxDuration: 350, maxMemory: 1500 },
    }),
  );
});
```

### Test Types and Constraints

| Type             | Count  | Required Constraints         | Name Suffix        |
| ---------------- | ------ | ---------------------------- | ------------------ |
| Scaling          | Array  | `scaling`, `tolerance`       | "scaling"          |
| Single           | Number | `maxDuration` or `maxMemory` | "performance"      |
| Memory stability | 1000+  | `maxMemory` only             | "memory stability" |

### Scaling Tests

Scaling tests use an array of counts to measure algorithmic complexity:

```javascript
test(
  "Index.query scaling",
  createPerformanceTest({
    count: [100, 500, 1000, 2000],
    setupFn: (vectorCount) => createDependencies(vectorCount),
    testFn: ({ index, query }) => index.query(query),
    constraints: {
      maxDuration: 650,
      maxMemory: 82000,
      scaling: "linear",
      tolerance: 2.0,
    },
  }),
);
```

Scaling options:

- `scaling: "linear"` — Duration/memory scales proportionally with count
- `scaling: "sublinear"` — Better than linear (e.g., logarithmic)
- `tolerance` — Multiplier for acceptable variance (default: 2.0)

### Memory Stability Tests

Memory stability tests run many iterations to detect leaks:

```javascript
test(
  "Component.method memory stability",
  createPerformanceTest({
    count: 1000,
    setupFn: (iterations) => ({ component, iterations }),
    testFn: async ({ component, iterations }) => {
      for (let i = 0; i < iterations; i++) {
        await component.process(data);
      }
    },
    constraints: {
      maxMemory: 5000,
    },
  }),
);
```

### Constraint Guidelines

| Complexity | maxDuration | maxMemory  |
| ---------- | ----------- | ---------- |
| Quick      | 150-250ms   | 500-1000KB |
| Medium     | 300-500ms   | 1-2MB      |
| Heavy      | 500-1000ms  | 2-5MB      |
| Memory     | —           | +20-30%    |

### Setup Functions

Setup functions receive count and return test context:

```javascript
setupFn: async (count) => {
  const data = generateTestData(count);
  const index = new Index(mockStorage);
  await index.loadData();
  return { index, data, count };
};
```

The returned object is passed to `testFn` for execution.

## Prohibitions

1. **DO NOT** mix performance tests with unit tests in the same file
2. **DO NOT** run without `--expose-gc` flag
3. **DO NOT** use libraries other than `@copilot-ld/libperf`
4. **DO NOT** use `maxDuration` in memory stability tests
5. **DO NOT** create scaling tests without `scaling` and `tolerance` constraints
6. **DO NOT** commit tests that consistently fail in CI
7. **DO NOT** set tolerance below 2.0 without justification in comments
