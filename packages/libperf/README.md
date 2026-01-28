# libperf

Performance testing and benchmarking utilities for measuring execution time,
memory usage, and scaling characteristics.

## Usage

```javascript
import {
  benchmark,
  validateDuration,
  validateMemory,
} from "@copilot-ld/libperf";

const result = await benchmark(
  async () => {
    await myFunction();
  },
  { iterations: 100 },
);

validateDuration(result, 50); // max 50ms
```

## API

| Export             | Description                     |
| ------------------ | ------------------------------- |
| `PerfRunner`       | Performance test runner         |
| `PerfResult`       | Performance measurement results |
| `ScalingAnalyzer`  | Detect scaling characteristics  |
| `benchmark`        | Run benchmarks with iterations  |
| `validateDuration` | Assert max execution time       |
| `validateMemory`   | Assert max memory usage         |
| `validateScaling`  | Assert linear/sublinear scaling |
