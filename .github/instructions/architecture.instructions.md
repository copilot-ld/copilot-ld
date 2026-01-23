---
applyTo: "**"
---

# Architecture

gRPC services, framework-agnostic packages, REST extensions.

## Directory Boundaries

| Directory     | Contains                      |
| ------------- | ----------------------------- |
| `/services`   | gRPC services only            |
| `/extensions` | REST API adapters only        |
| `/packages`   | Framework-agnostic logic only |
| `/proto`      | Protocol Buffer schemas       |
| `/tools`      | Platform extensions           |

## Patterns

Services extend generated `*Base` class, inject dependencies via constructor.

Import processors/indices from subdirectories, never from package main index:

```javascript
import { MyIndex } from "@pkg/lib/index/my.js"; // ✓
import { MyIndex } from "@pkg/lib"; // ✗ circular dep
```

Use `Type.fromObject()` for protobufs, not `new Type()`.

Code generation: `make codegen`

## Prohibited

- REST for inter-service communication (use gRPC)
- State within service instances (inject dependencies)
- Direct service-to-service dependencies (route through Agent)
- Framework-specific code in `/packages`
- Exporting processors/indices from package main `index.js`
- `new Type()` for protobufs (use `Type.fromObject()`)
