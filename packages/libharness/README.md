# libharness

Test harness and mock infrastructure for copilot-ld tests.

## Structure

```
packages/libharness/
├── index.js                    # Re-exports all fixtures and mocks
├── fixture/
│   ├── index.js               # Re-exports all fixtures
│   ├── assertions.js          # Test assertion helpers
│   └── services.js            # Service test fixtures
└── mock/
    ├── index.js               # Re-exports all mocks
    ├── config.js              # Configuration mocks
    ├── storage.js             # Storage interface mocks
    ├── logger.js              # Logger mocks
    ├── resource-index.js      # Resource index mocks (requires codegen)
    ├── grpc.js                # gRPC infrastructure mocks
    ├── http.js                # HTTP request/response mocks
    ├── clients.js             # Service client mocks (requires codegen)
    ├── observer.js            # Observer and tracer mocks
    ├── service-callbacks.js   # Agent service callbacks (requires codegen)
    ├── data.js                # Static test data
    └── services.js            # Service-specific mocks
```

## Usage

### Basic Mocks

Import framework-independent mocks directly:

```javascript
import {
  createMockConfig,
  createMockStorage,
  createMockLogger,
} from "@copilot-ld/libharness";

const config = createMockConfig("my-service");
const storage = createMockStorage();
const logger = createMockLogger();
```

### Service Mocks

Service-related mocks require generated types from `@copilot-ld/libtype`:

```javascript
import {
  createMockResourceIndex,
  createMockMemoryClient,
  createMockLlmClient,
} from "@copilot-ld/libharness";

const index = createMockResourceIndex({
  tools: ["search"],
  conversationId: "test-conv",
});

const memoryClient = createMockMemoryClient();
const llmClient = createMockLlmClient();
```

### Test Utilities

```javascript/* eslint-disable no-undef */import {
  assertThrowsMessage,
  assertRejectsMessage,
  createDeferred,
} from "@copilot-ld/libharness";

test("throws with message", () => {
  assertThrowsMessage(() => fn(), /expected error/);
});

test("async rejection", async () => {
  await assertRejectsMessage(() => asyncFn(), /expected error/);
});
```

## Mock Factories

All mock factory functions accept an `overrides` parameter to customize
behavior:

```javascript
const storage = createMockStorage({
  get: mock.fn(() => Promise.resolve("custom")),
});

const logger = createMockLogger({ captureOutput: true });
console.log(logger.logs); // Access captured logs

const config = createMockServiceConfig("test", { budget: 2000 });
```

## Benefits

- **Single source of truth** - One implementation per mock type
- **Consistent APIs** - All mocks follow the same patterns
- **Easy updates** - Change mock in one place, all tests updated
- **Better documentation** - JSDoc on all shared mocks
- **Faster test writing** - Import and use, no boilerplate
- **Versioned** - Proper semantic versioning for test infrastructure
- **Reusable** - Can be used across multiple repositories

## Migration

When refactoring existing tests:

1. Add `@copilot-ld/libharness` as a dev dependency
2. Identify repeated mock implementations
3. Replace with imports from `@copilot-ld/libharness`
4. Customize with `overrides` parameter if needed
5. Remove local mock definitions

Before:

```javascript
let mockStorage;
beforeEach(() => {
  mockStorage = {
    data: new Map(),
    async put(key, value) {
      /* ... */
    },
    async get(key) {
      /* ... */
    },
  };
});
```

After:

```javascript
import { createMockStorage } from "@copilot-ld/libharness";

let mockStorage;
beforeEach(() => {
  mockStorage = createMockStorage();
});
```
