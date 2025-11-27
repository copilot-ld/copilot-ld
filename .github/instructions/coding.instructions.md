---
applyTo: "**/*.js"
---

# Coding Instructions

Coding standards for JavaScript files enforcing constructor-based dependency
injection, radical simplicity, and explicit error propagation.

## Principles

1. **Radical Simplicity**: Choose the simplest correct solution without
   over-engineering
2. **Constructor Dependency Injection**: Inject all dependencies through
   constructors with validation, never create internally
3. **Explicit Over Implicit**: Declare all behavior and dependencies visibly in
   signatures
4. **No Defensive Programming**: Let errors propagate naturally without
   value-less try/catch
5. **No Backward Compatibility**: Implement current requirements only, no
   fallbacks

## Requirements

### Class Structure

Classes use private fields, constructor injection, and explicit validation:

```javascript
export class Service {
  #dep1;
  #dep2;
  constructor(dep1, dep2) {
    if (!dep1) throw new Error("dep1 is required");
    if (!dep2) throw new Error("dep2 is required");
    this.#dep1 = dep1;
    this.#dep2 = dep2;
  }
  async method(params) {
    return this.#dep1.operation(params);
  }
}
```

### Factory Functions

Use factory functions when dependencies are created at runtime:

```javascript
class Service {
  #factory;
  constructor(factory) {
    if (typeof factory !== "function") throw new Error("factory required");
    this.#factory = factory;
  }
  async process(token, request) {
    const client = this.#factory(token);
    return client.execute(request);
  }
}
```

### Import Order

Imports are ordered: external libraries → internal packages → local imports
(each group alphabetical).

### Logging

Services use `this.debug(message, context)` from the generated base class. Log
at service boundaries and before external calls. Messages start with action
verbs. No sensitive data in logs.

### Async Optimization

Use `Promise.all()` for independent parallel operations:

```javascript
const [data1, data2] = await Promise.all([
  this.#client1.fetch(id),
  this.#client2.fetch(id),
]);
```

## Prohibitions

1. **NO** creating dependencies inside methods—use constructor injection
2. **NO** object destructuring for constructor dependencies—use individual
   parameters
3. **NO** global state or singletons—pass dependencies explicitly
4. **NO** catching errors only to re-throw without adding context
5. **NO** mixing business logic with dependency creation
6. **NO** inheritance for code reuse—use composition
7. **NO** public fields—use private field syntax (`#`)
8. **NO** `var` declarations—use `const` and `let`
9. **NO** defensive try/catch—let errors bubble up
10. **NO** backward compatibility or legacy fallbacks
