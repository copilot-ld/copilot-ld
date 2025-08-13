---
applyTo: "**/*.js"
---

# Coding Instructions

## Purpose Declaration

This file defines comprehensive coding standards and patterns for all JavaScript
files in this project to ensure consistent implementation across the
microservices-based platform through radical simplicity, constructor-based
dependency injection, and interface-first design patterns.

## Core Principles

1. **Radical Simplicity**: Every solution must be the simplest approach that
   correctly solves the problem without over-engineering
2. **Single Responsibility**: Every class, function, and module must have
   exactly one clear, well-defined purpose with measurable boundaries
3. **Constructor-Based Dependency Injection**: All dependencies must be injected
   through constructors with explicit validation, never created internally
4. **Interface-First Design**: All packages must define TypeScript-style
   interfaces in types.js before any implementation
5. **Explicit Over Implicit**: All behavior, dependencies, and side effects must
   be explicitly declared and visible in method signatures
6. **No Defensive Programming**: Never use defensive programming patterns - let
   errors bubble up naturally without try/catch blocks that add no value
7. **No Backward Compatibility**: Never provide backward compatibility,
   fallbacks, or legacy code handling - implement current requirements only

## Implementation Requirements

### Class Structure Requirements

Every class must use constructor dependency injection with private fields and
validation:

```javascript
export class ServiceInterface {
  constructor(config) {
    if (!config) throw new Error("config is required");
    this.config = config;
  }
}

export class Service extends ServiceInterface {
  #dependency1;
  #dependency2;

  constructor(config, dependency1, dependency2) {
    super(config);
    if (!dependency1) throw new Error("dependency1 is required");
    if (!dependency2) throw new Error("dependency2 is required");

    this.#dependency1 = dependency1;
    this.#dependency2 = dependency2;
  }

  async methodName(params) {
    const result = await this.#dependency1.operation(params);
    return this.#dependency2.process(result);
  }
}
```

### Dependency Injection Pattern Requirements

**✅ CORRECT - Individual parameters with explicit validation:**

```javascript
class ReplService {
  #readline;
  #process;
  #formatter;

  constructor(readline, process, formatter, options = {}) {
    if (!readline) throw new Error("readline dependency is required");
    if (!process) throw new Error("process dependency is required");
    if (!formatter) throw new Error("formatter dependency is required");

    this.#readline = readline;
    this.#process = process;
    this.#formatter = formatter;
    this.options = options;
  }

  createInterface() {
    return this.#readline.createInterface({
      input: this.#process.stdin,
      output: this.#process.stdout,
    });
  }

  formatOutput(text) {
    return this.#formatter.format(text);
  }
}
```

**❌ INCORRECT - Object destructuring in constructor:**

```javascript
// DO NOT USE - Object destructuring for dependencies
class ReplService {
  constructor({ readline, process, formatter }, options = {}) {
    // This pattern is forbidden
  }
}
```

### Interface Definition Requirements

All packages must define interfaces in types.js with complete method signatures:

```javascript
export class ServiceInterface {
  constructor(config) {
    throw new Error("Interface method not implemented");
  }

  async operation(params) {
    throw new Error("Interface method not implemented");
  }
}
```

### Factory Function Requirements

Use factory functions for runtime dependency creation:

```javascript
class Copilot {
  constructor(token, model) {
    this.token = token;
    this.model = model;
  }

  async createCompletions(request) {
    // Implementation
    return { response: "completion" };
  }
}

function createCopilotInstance(token, model) {
  return new Copilot(token, model);
}

export class ServiceInterface {
  constructor(config) {
    if (!config) throw new Error("config is required");
    this.config = config;
  }
}

class LlmService extends ServiceInterface {
  #copilotFactory;

  constructor(config, copilotFactory) {
    super(config);
    if (typeof copilotFactory !== "function") {
      throw new Error("copilotFactory must be a function");
    }
    this.#copilotFactory = copilotFactory;
  }

  async processRequest(githubToken, request) {
    const copilot = this.#copilotFactory(githubToken, this.config.model);
    return await copilot.createCompletions(request);
  }
}
```

### Logging Requirements

Services must use the injected debug method for all logging following these
requirements:

```javascript
import { Service } from "@copilot-ld/libservice";

class ServiceImplementation extends Service {
  async processRequest(request) {
    // Log at service boundaries with context
    this.debug("Processing request", { session: request.sessionId });

    // Log before external calls
    this.debug("Querying vector index", { threshold: 0.3, limit: 10 });
    const results = await this.vectorClient.QueryItems(request);

    // Log state changes with metrics
    this.debug("Filtered results", { matched: "20/30", tokens: "200/300" });

    return results;
  }
}
```

**Logging Guidelines:**

- **Service boundaries**: Log incoming requests and outgoing responses
- **External calls**: Log before database, API, or file I/O operations
- **State changes**: Log before/after data transformations with metrics
- **Message format**: Start with action verb, include key/value context
- **Prohibited**: No sensitive data, no tight loops, no vague messages

## Best Practices

### Import Order Requirements

Follow strict import ordering for consistent file organization:

```javascript
/* eslint-env node */
// 1. External libraries (alphabetical)
import grpc from "@grpc/grpc-js";
import NodeCache from "node-cache";

// 2. Internal packages (alphabetical)
import { Config } from "@copilot-ld/libconfig";
import { Service } from "@copilot-ld/libservice";

// 3. Local imports (relative paths, alphabetical)
import { DatabaseInterface } from "./interfaces/database.js";
```

### Method Chaining Patterns

Use method chaining for builder patterns with clear return types:

```javascript
class QueryBuilder {
  #conditions = [];

  where(field, value) {
    this.#conditions.push({ field, value });
    return this;
  }

  build() {
    return this.#conditions.filter(Boolean);
  }
}
```

### Async/Await Optimization

Optimize performance through proper async handling:

```javascript
class RequestProcessor {
  #clients;

  constructor(clients) {
    this.#clients = clients;
  }

  // Parallel execution for independent operations
  async processRequest(params) {
    const [historyData, embeddings] = await Promise.all([
      this.#clients.history.GetHistory({ session_id: params.sessionId }),
      this.#clients.llm.CreateEmbeddings({ chunks: [params.content] }),
    ]);

    const results = await this.#clients.vector.QueryItems({
      vector: embeddings.data[0].embedding,
      threshold: this.config.threshold,
    });

    return this.#formatResponse(results, historyData);
  }

  #formatResponse(results, historyData) {
    return { results, historyData };
  }
}
```

### Error Propagation Patterns

Let errors bubble up naturally without defensive programming:

```javascript
// Preferred: No defensive programming - let errors propagate
export class ChunkService {
  #storage;

  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
  }

  async getChunk(id) {
    // No try/catch - let storage errors propagate naturally
    const data = await this.#storage.read(id);
    return JSON.parse(data);
  }

  async saveChunk(id, chunk) {
    // No try/catch - let validation and storage errors propagate
    const serialized = JSON.stringify(chunk);
    await this.#storage.write(id, serialized);
    return id;
  }
}
```

### Current Implementation Only

Implement only current requirements without backward compatibility:

```javascript
import YAML from "yaml";

// Preferred: Current implementation only - no legacy support
export class ConfigLoader {
  #fs;

  constructor(fs) {
    if (!fs) throw new Error("fs dependency is required");
    this.#fs = fs;
  }

  async loadConfig(path) {
    // Only support current YAML format - no fallbacks for old formats
    const content = await this.#fs.readFile(path, "utf8");
    return YAML.parse(content);
  }
}
```

## Explicit Prohibitions

### Forbidden Architectural Patterns

1. **DO NOT** create dependencies inside methods or functions - use constructor
   injection exclusively
2. **DO NOT** use object destructuring in constructors for dependency
   injection - pass dependencies as individual parameters with explicit
   validation
3. **DO NOT** use global state or singleton patterns - pass all dependencies
   explicitly through constructors
4. **DO NOT** catch errors only to re-throw them without adding meaningful
   context
5. **DO NOT** mix business logic with dependency creation or service
   initialization
6. **DO NOT** use inheritance for code reuse - prefer composition through
   dependency injection
7. **DO NOT** expose private fields or internal state - use private field syntax
   (#) consistently
8. **DO NOT** omit interface definitions - every package must define types.js
   with complete interfaces
9. **DO NOT** use var or mutable global variables - use const and let with block
   scoping
10. **DO NOT** use defensive programming patterns - let errors propagate
    naturally without unnecessary try/catch
11. **DO NOT** implement backward compatibility, fallbacks, or legacy code
    support - implement current requirements only

### Alternative Approaches

- Instead of internal dependency creation → Use constructor injection with
  validation
- Instead of object destructuring → Pass dependencies as individual parameters
  with explicit validation
- Instead of global state → Pass dependencies explicitly through constructor
  parameters
- Instead of pointless try/catch → Let errors propagate naturally or add
  meaningful context
- Instead of mixed concerns → Separate dependency injection from business logic
  implementation
- Instead of inheritance for reuse → Use composition with injected dependencies
- Instead of public fields → Use private fields (#) with getter methods when
  access is needed
- Instead of implementation-only packages → Define complete interfaces in
  types.js first
- Instead of var declarations → Use const for immutable values and let for
  reassignable variables
- Instead of defensive programming → Let errors bubble up naturally without
  unnecessary exception handling
- Instead of backward compatibility → Implement current requirements only
  without legacy fallbacks

## Comprehensive Examples

### Complete Service Implementation

```javascript
/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { Service } from "@copilot-ld/libservice";

class VectorService extends Service {
  #vectorIndices;

  constructor(config, vectorIndices, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    if (!vectorIndices || !(vectorIndices instanceof Map)) {
      throw new Error("vectorIndices must be a Map instance");
    }
    this.#vectorIndices = vectorIndices;
  }

  async QueryItems({ indices, vector, threshold, limit }) {
    this.debug("Querying vector indices", {
      indices: indices.join(","),
      threshold,
      limit,
    });

    if (!vector || !Array.isArray(vector)) {
      throw new Error("vector must be a non-empty array");
    }

    const requestedIndices = indices
      .map((name) => this.#vectorIndices.get(name))
      .filter((index) => index);

    // No defensive programming - let errors propagate from queryIndices
    const results = await this.#queryIndices(
      requestedIndices,
      vector,
      threshold,
      limit,
    );

    this.debug("Query complete", {
      results: `${results.items.length}/${results.total}`,
    });

    return { results: results.items, total: results.total };
  }

  async #queryIndices(indices, vector, threshold, limit) {
    // No try/catch - let individual index query errors propagate
    const queries = indices.map((index) =>
      index.queryItems(vector, threshold, limit),
    );
    const results = await Promise.all(queries);
    const allItems = results.flat();

    allItems.sort((a, b) => b.score - a.score);
    return { items: allItems.slice(0, limit), total: allItems.length };
  }
}

// Current implementation only - no support for legacy vector formats
async function initializeVectorIndices(config) {
  // Mock implementation
  return new Map();
}

const config = new ServiceConfig("vector");
const vectorIndices = await initializeVectorIndices(config);
const service = new VectorService(config, vectorIndices);
await service.start();
```

### Package with Interface and Factory

```javascript
import { FormatterInterface } from "./types.js";

export class HtmlFormatter extends FormatterInterface {
  #jsdom;
  #domPurify;
  #marked;

  constructor({ jsdom, domPurify, marked }) {
    super();
    if (!jsdom) throw new Error("jsdom dependency is required");
    if (!domPurify) throw new Error("domPurify dependency is required");
    if (!marked) throw new Error("marked dependency is required");

    this.#jsdom = jsdom;
    this.#domPurify = domPurify;
    this.#marked = marked;
  }

  format(markdown) {
    const window = new this.#jsdom.JSDOM("").window;
    const purify = this.#domPurify(window);
    const rawHtml = this.#marked.parse(markdown);

    return purify.sanitize(rawHtml, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "pre"],
      ALLOWED_ATTR: ["href", "title"],
    });
  }
}

export function createHtmlFormatter() {
  return new HtmlFormatter({
    jsdom: { JSDOM: import("jsdom").JSDOM },
    domPurify: import("dompurify"),
    marked: import("marked"),
  });
}

export { FormatterInterface };
```
