---
applyTo: "**/*.perf.js"
---

# Performance Instructions

Performance tests use `@copilot-ld/libperf` in separate `*.perf.js` files.

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
import { test } from "node:test";
import { createPerformanceTest } from "@copilot-ld/libperf";

test(
  "Component.method performance",
  createPerformanceTest({
    count: 50, // or array [100, 500, 1000] for scaling
    setupFn: async (count) => ({ data: createTestData(count) }),
    testFn: async ({ data }) => component.process(data),
    constraints: { maxDuration: 350, maxMemory: 1500 },
  }),
);
```

### Test Types and Constraints

| Type             | Count  | Required Constraints         | Name Suffix        |
| ---------------- | ------ | ---------------------------- | ------------------ |
| Scaling          | Array  | `scaling`, `tolerance`       | "scaling"          |
| Single           | Number | `maxDuration` or `maxMemory` | "performance"      |
| Memory stability | 1000+  | `maxMemory` only             | "memory stability" |

### Constraint Guidelines

| Complexity | maxDuration | maxMemory  |
| ---------- | ----------- | ---------- |
| Quick      | 150-250ms   | 500-1000KB |
| Medium     | 300-500ms   | 1-2MB      |
| Heavy      | 500-1000ms  | 2-5MB      |
| Memory     | —           | +20-30%    |

## Prohibitions

1. **DO NOT** mix performance tests with unit tests in the same file
2. **DO NOT** run without `--expose-gc` flag
3. **DO NOT** use libraries other than `@copilot-ld/libperf`
4. **DO NOT** use `maxDuration` in memory stability tests
5. **DO NOT** create scaling tests without `scaling` and `tolerance` constraints
6. **DO NOT** commit tests that consistently fail in CI
