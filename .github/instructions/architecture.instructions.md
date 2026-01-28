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
package main index.

**Protobuf Instantiation**: Use `Type.fromObject()` for protobufs, not
`new Type()`.

**Code Generation**: Run `make codegen` after modifying `.proto` files.

## Prohibitions

1. **DO NOT** use backward compatibility shims or deprecation warnings
2. **DO NOT** use REST for inter-service communication (use gRPC)
3. **DO NOT** store state within service instances (inject dependencies)
4. **DO NOT** put framework-specific code in `/packages`
5. **DO NOT** export processors/indices from package main `index.js`
6. **DO NOT** use `new Type()` for protobufs (use `Type.fromObject()`)
