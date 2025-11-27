---
applyTo: "**"
---

# Architecture Instructions

Defines the microservices platform structure: gRPC services, framework-agnostic
packages, and REST extensions with strict directory boundaries.

## Principles

1. **gRPC Internal, REST External**: Services communicate via gRPC; extensions
   expose REST APIs to external clients
2. **Stateless Services**: Services maintain no state between requests; use
   injected storage/indices for persistence
3. **Framework-Agnostic Packages**: Code in `/packages` has no framework
   dependencies and is reusable across contexts
4. **Core System Immutability**: Tools in `/tools` extend the platform without
   modifying `/services`, `/packages`, or `/proto`
5. **Agent Orchestration**: Complex multi-service operations route through the
   Agent service

## Requirements

### Directory Structure

| Directory     | Purpose                         |
| ------------- | ------------------------------- |
| `/services`   | gRPC services only              |
| `/extensions` | REST API adapters only          |
| `/packages`   | Framework-agnostic logic only   |
| `/proto`      | Protocol Buffer schemas         |
| `/tools`      | Platform extensions (new tools) |
| `/scripts`    | Development utilities           |
| `/data`       | Static definitions and indices  |

### Service Pattern

Services extend a generated `*Base` class and override RPC methods:

```javascript
// services/myservice/index.js
import { MyServiceBase } from "./service.js"; // generated

class MyService extends MyServiceBase {
  #index;
  constructor(config, index) {
    super(config);
    this.#index = index;
  }
  async RpcMethod(req) {
    return { result: await this.#index.query(req.input) };
  }
}
```

### Package Organization

Processors and indices live in subdirectories, never exported from main index:

```javascript
// ✅ Direct import from subdirectory
import { MyProcessor } from "@pkg/lib/processor/my.js";
import { MyIndex } from "@pkg/lib/index/my.js";

// ❌ Never from main package index (causes circular deps)
import { MyProcessor, MyIndex } from "@pkg/lib";
```

### Protobuf Object Creation

Use `Type.fromObject()` for all protobuf instantiation to activate monkey
patches and deep initialization:

```javascript
// ✅ Correct - enables type conversions and validation
const msg = namespace.Message.fromObject({ field: value });

// ❌ Incorrect - flat initialization only
const msg = new namespace.Message({ field: value });
```

### Import Order

```javascript
// 1. External libraries (alphabetical)
// 2. Internal packages (alphabetical)
// 3. Local imports (relative paths, alphabetical)
```

### Code Generation

```bash
npm run codegen         # Generate all (types, services, clients)
npm run codegen:type    # Generate types only
npm run codegen:service # Generate service bases only
npm run codegen:client  # Generate clients only
```

Generated code imports enhanced types from core packages, not raw generated
types.

## Prohibitions

1. **DO NOT** use REST for inter-service communication - gRPC only
2. **DO NOT** expose backend service ports to host network - internal only
3. **DO NOT** maintain state within service instances - inject dependencies
4. **DO NOT** create direct service-to-service dependencies - route through
   Agent
5. **DO NOT** put framework-specific code in `/packages`
6. **DO NOT** modify core system to accommodate new tools - tools adapt to core
7. **DO NOT** export processors/indices from package main `index.js`
8. **DO NOT** use `new Type()` for protobufs - use `Type.fromObject()`
9. **DO NOT** import raw generated types - use enhanced core packages
10. **DO NOT** create circular dependencies between packages
