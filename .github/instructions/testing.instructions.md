---
applyTo: "**/*.test.js"
---

# Testing Instructions

## Purpose Declaration

This file provides comprehensive testing standards for JavaScript test files
using Node.js built-in testing framework to ensure consistent, maintainable, and
reliable tests across this project's codebase.

## Core Principles

1. **Single Testing Framework**: Use `node:test` exclusively - No external
   testing frameworks or assertion libraries allowed
2. **Node.js Built-in Only**: Leverage Node.js 18+ built-in testing capabilities
   with `node:assert` for assertions
3. **Test Isolation**: All tests must be independent and not rely on shared
   state between test cases
4. **Mock External Dependencies**: Keep tests isolated and fast by mocking all
   external service dependencies
5. **Behavior Testing**: Test what the code does, not how it implements the
   behavior internally

## Implementation Requirements

### Required Import Pattern

All test files must use this exact import structure:

```javascript
// Standard imports - always first
import {
  test,
  describe,
  before,
  after,
  beforeEach,
  afterEach,
} from "node:test";
import assert from "node:assert";

// Module under test - second section
import { ComponentName } from "../index.js";

// Mock imports - third section, alphabetically ordered
import { mockHistoryService } from "../../test/shared/mock/history.js";
import { mockVectorService } from "../../test/shared/mock/vector.js";
import { testRequestData } from "./mock/data.js";
```

### Directory Structure Requirements

```
../services/agent/test/
│   ├── agent.test.js
│   ├── mock/
│   │   ├── dependencies.js      # Agent-specific dependency mocks
│   │   └── data.js              # Agent-specific test data
│   └── fixture/
│       └── requests.js          # Agent test fixtures
../packages/libservice/test/
│   ├── service.test.js
│   └── helpers/
│       └── grpc-helpers.js
../test/
    ├── shared/
    │   ├── mock/
    │   │   ├── vector.js         # Vector service mock
    │   │   ├── history.js        # History service mock
    │   │   └── data.js           # Common test data
    │   └── fixture/
    │       └── services.js       # Shared test fixtures
    └── integration/
        └── agent-flow.test.js
```

### Naming Conventions

- **Tests**: `<module-name>.test.js`
- **Mocks**: `<service-name>.js` in `mock/` directories
- **Data**: `data.js` for test data
- **Fixtures**: `<purpose>.js` in `fixture/` directories

### Mock Creation Pattern

```javascript
// ./test/shared/mock/vector.js
export function mockVectorService(overrides = {}) {
  return {
    queryItems: async (request, callback) => {
      callback(null, { items: [], total: 0 });
    },
    close: () => {},
    ...overrides,
  };
}
```

## Best Practices

### Test Structure Requirements

1. **Descriptive Test Names**: Use clear, behavior-describing test names that
   explain what is being tested
2. **Single Assertion per Concept**: Don't over-assert - test one logical
   concept per test case
3. **Minimal Setup**: Only create what's needed for the specific test - avoid
   excessive test preparation
4. **Resource Cleanup**: Use before/after hooks to manage test state and clean
   up resources

### Test Organization Pattern

```javascript
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";

// Mock functions for testing
function createMockDependency() {
  return { mockMethod: () => "mocked" };
}

// Mock class for testing
class ComponentName {
  constructor(dependency) {
    this.dependency = dependency;
  }

  async method(input) {
    return { status: "success", data: [input] };
  }
}

const validInput = "test input";

describe("ComponentName", () => {
  let component;
  let mockDependency;

  beforeEach(() => {
    mockDependency = createMockDependency();
    component = new ComponentName(mockDependency);
  });

  test("performs expected behavior when given valid input", async () => {
    const result = await component.method(validInput);

    assert.strictEqual(result.status, "success");
    assert(result.data.length > 0);
  });
});
```

### Error Testing Requirements

All error conditions must be tested using `assert.rejects`:

```javascript
import { test } from "node:test";
import assert from "node:assert";

// Mock functions for testing
function createMockDependency() {
  return { mockMethod: () => "mocked" };
}

// Mock class for testing
class ComponentName {
  constructor(dependency) {
    this.dependency = dependency;
  }

  async method(input) {
    if (!input) throw new Error("Invalid input");
    return { status: "success", data: [input] };
  }
}

const invalidInput = null; // Example invalid input
const component = new ComponentName(createMockDependency());

test("throws error for invalid input", async () => {
  await assert.rejects(() => component.method(invalidInput), {
    message: /Invalid input/,
  });
});
```

## Explicit Prohibitions

### Forbidden Practices

1. **DO NOT** use external testing frameworks (Jest, Mocha, etc.)
2. **DO NOT** use external assertion libraries (Chai, etc.)
3. **DO NOT** share state between test cases
4. **DO NOT** test implementation details - focus on behavior
5. **DO NOT** create tests that depend on external services without mocking
6. **DO NOT** use hard-coded delays (`setTimeout`) in tests
7. **DO NOT** commit tests with console.log statements for debugging

### Alternative Approaches

- Instead of external frameworks → Use `node:test`
- Instead of shared state → Use `beforeEach` for isolated setup
- Instead of implementation testing → Test public API behavior
- Instead of external service calls → Use dependency injection with mocks

## Comprehensive Examples

### Basic Service Test Example

```javascript
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { VectorService } from "../index.js";
import { testVectorData } from "../../test/shared/mock/data.js";

describe("VectorService", () => {
  let vectorService;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      query: async () => testVectorData.slice(0, 1),
    };
    vectorService = new VectorService(mockStorage);
  });

  test("returns items matching query", async () => {
    const result = await vectorService.queryItems({
      embedding: [0.1, 0.2, 0.3],
      limit: 10,
    });

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].id, "vector-1");
  });

  test("handles empty results gracefully", async () => {
    mockStorage.query = async () => [];

    const result = await vectorService.queryItems({
      embedding: [0.1, 0.2, 0.3],
      limit: 10,
    });

    assert.strictEqual(result.items.length, 0);
  });

  test("throws error for invalid embedding", async () => {
    await assert.rejects(
      () => vectorService.queryItems({ embedding: null, limit: 10 }),
      { message: /Invalid embedding/ },
    );
  });
});
```

### Integration Test Example

```javascript
import { test, describe, before, after } from "node:test";
import assert from "node:assert";

// Module under test
import { AgentService } from "../../services/agent/index.js";

// Mock imports
import { mockHistoryService } from "../shared/mock/history.js";
import { mockVectorService } from "../shared/mock/vector.js";
import { testRequestData } from "../shared/mock/data.js";

describe("Agent Service Integration", () => {
  let agentService;

  before(async () => {
    const mockServices = {
      vector: mockVectorService({
        queryItems: async (request, callback) => {
          callback(null, {
            items: [{ id: "chunk1", score: 0.95 }],
            total: 1,
          });
        },
      }),
      history: mockHistoryService(),
    };

    agentService = new AgentService(mockServices);
  });

  after(async () => {
    await agentService.close();
  });

  test("processes complete request flow", async () => {
    const request = {
      ...testRequestData,
      query: "docker security best practices",
    };

    const response = await agentService.processRequest(request);

    assert.strictEqual(response.status, "success");
    assert(response.chunks.length > 0);
    assert.strictEqual(response.chunks[0].id, "chunk1");
  });
});
```

### Performance Test Example

```javascript
import { test } from "node:test";
import assert from "node:assert";

// Mock agentService for example
const agentService = {
  async processRequest(request) {
    return { status: "success" };
  },
};

test("processes request within time limit", async () => {
  const start = performance.now();

  await agentService.processRequest({ query: "test" });

  const duration = performance.now() - start;
  assert(duration < 1000, `Request took too long: ${duration}ms`);
});
```

### Running Tests

Execute tests using these exact commands:

```bash
# Run all tests across workspaces
npm test

# Run tests for specific package
npm test -w @copilot-ld/libservice

# Run integration tests
node --test test/integration/**/*.test.js

# Run with watch mode
npm test -- --watch

# Run specific test file
node --test services/agent/test/agent.test.js
```
