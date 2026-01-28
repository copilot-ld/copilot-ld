---
applyTo: "**"
---

# Architecture

gRPC services, framework-agnostic packages, REST extensions.

## Principles

1. **Clean Breaks Only**: No backward compatibility, no deprecation periods, no
   legacy code. Change it right or don't change it.
2. **Separation of Concerns**: Services handle protocol, packages handle logic,
   extensions expose HTTP.
3. **Dependency Injection**: All dependencies flow through constructors, never
   imported directly in service code.

## Directory Boundaries

| Directory     | Contains                      | Communicates Via |
| ------------- | ----------------------------- | ---------------- |
| `/services`   | gRPC services only            | gRPC             |
| `/extensions` | REST API adapters only        | HTTP (external)  |
| `/packages`   | Framework-agnostic logic only | Function calls   |
| `/proto`      | Protocol Buffer schemas       | —                |
| `/tools`      | Platform extensions           | Varies           |

## Patterns

**Service Implementation**: Extend generated `*Base` class, inject dependencies
via constructor. Services are stateless request handlers.

**Import Structure**: Import processors/indices from subdirectories, never from
package main index:

```javascript
import { MyIndex } from "@pkg/lib/index/my.js"; // ✓
import { MyIndex } from "@pkg/lib"; // ✗ circular dep
```

**Protobuf Instantiation**: Use `Type.fromObject()` for protobufs, not
`new Type()`.

**Code Generation**: Run `make codegen` after modifying `.proto` files.

## Prohibited

- **NO** backward compatibility shims or deprecation warnings
- **NO** REST for inter-service communication (use gRPC)
- **NO** state within service instances (inject dependencies)
- **NO** direct service-to-service dependencies (route through Agent)
- **NO** framework-specific code in `/packages`
- **NO** exporting processors/indices from package main `index.js`
- **NO** `new Type()` for protobufs (use `Type.fromObject()`)
