---
applyTo: "**/*.test.js"
---

# JavaScript Testing Instructions

Standards for test files using Node.js built-in testing and `@copilot-ld/libharness`.

## Principles

1. `node:test`, `node:assert`, and `@copilot-ld/libharness` only—no external libraries
2. Use libharness mocks first; create local mocks only for component-specific needs
3. Tests are isolated with no shared state between test cases
4. Tests verify behavior, not implementation details

## Requirements

### Import Order

```javascript
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { createMockConfig, createMockStorage } from "@copilot-ld/libharness";
import { ModuleUnderTest } from "../index.js";
```

### Using libharness Mocks

Import from `@copilot-ld/libharness` for common dependencies:

| Factory                      | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `createMockConfig`           | Base config with name, port, etc.    |
| `createMockServiceConfig`    | Service config with budget/threshold |
| `createMockStorage`          | Storage with get/put/append tracking |
| `createMockLogger`           | Logger with call tracking            |
| `createSilentLogger`         | No-op logger for quiet tests         |
| `createMockResourceIndex`    | Resource index with `setupDefaults`  |
| `createMockServiceCallbacks` | memory/llm/tool callbacks for agents |
| `createMockLlmClient`        | LLM client with completions/embed    |
| `createMockMemoryClient`     | Memory client with window/append     |
| `assertThrowsMessage`        | Assert sync throw with pattern       |
| `assertRejectsMessage`       | Assert async rejection with pattern  |

### Test Structure

```javascript
describe("Component", () => {
  let instance;
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    instance = new Component(createMockConfig("test"), mockStorage);
  });

  test("returns expected result", async () => {
    const result = await instance.process({ input: "value" });
    assert.strictEqual(result.status, "success");
  });
});
```

### Customizing Mocks

All libharness factories accept an `overrides` parameter:

```javascript
const storage = createMockStorage({
  get: mock.fn(() => Promise.resolve("custom")),
});

const logger = createMockLogger({ captureOutput: true });
// Access captured logs via logger.logs

const index = createMockResourceIndex({ tools: ["search"], agentId: "test" });
```

### Adding to libharness

When a mock is reused across 3+ packages, add it to libharness:

1. Create factory in `packages/libharness/mock/` or `packages/libharness/fixture/`
2. Export from the appropriate `index.js`
3. Add JSDoc with `@param` for overrides
4. Add tests in `packages/libharness/test/`

### Commands

```bash
npm test                          # All tests
npm test -w @scope/package        # Package tests
node --test path/to/file.test.js  # Single file
```

## Prohibitions

1. **DO NOT** use Jest, Mocha, Chai, or other external test libraries
2. **DO NOT** create local mocks when libharness provides one
3. **DO NOT** share mutable state between test cases
4. **DO NOT** test private methods or internal implementation
5. **DO NOT** call real external services—always mock
