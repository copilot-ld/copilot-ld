---
applyTo: "**/*.test.js"
---

# JavaScript Testing Instructions

Standards for test files using Node.js built-in testing framework exclusively.

## Principles

1. `node:test` and `node:assert` only—no external testing or assertion libraries
2. Tests are isolated with no shared state between test cases
3. External dependencies are mocked via dependency injection
4. Tests verify behavior, not implementation details

## Requirements

### Import Order

```javascript
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { ModuleUnderTest } from "../index.js";
import { mockDependency } from "./mock/dependency.js";
```

### Test Structure

```javascript
describe("Component", () => {
  let instance;
  let mockDep;

  beforeEach(() => {
    mockDep = { method: async () => ({ result: [] }) };
    instance = new Component(mockDep);
  });

  test("returns expected result for valid input", async () => {
    const result = await instance.process({ input: "value" });
    assert.strictEqual(result.status, "success");
  });

  test("throws for invalid input", async () => {
    await assert.rejects(() => instance.process(null), { message: /invalid/i });
  });
});
```

### Mock Pattern

```javascript
export function createMockService(overrides = {}) {
  return {
    query: async () => ({ items: [] }),
    close: () => {},
    ...overrides,
  };
}
```

### Directory Layout

| Path                       | Purpose                        |
| -------------------------- | ------------------------------ |
| `component/test/*.test.js` | Component tests                |
| `component/test/mock/`     | Component-specific mocks       |
| `test/shared/mock/`        | Cross-component mock utilities |

### Commands

```bash
npm test                          # All tests
npm test -w @scope/package        # Package tests
node --test path/to/file.test.js  # Single file
```

## Prohibitions

1. **DO NOT** use Jest, Mocha, Chai, or other external test libraries
2. **DO NOT** share mutable state between test cases
3. **DO NOT** test private methods or internal implementation
4. **DO NOT** call real external services—always mock
5. **DO NOT** use `setTimeout` for timing—use proper async patterns
6. **DO NOT** leave `console.log` debugging statements in tests
