---
applyTo: "**/*.js"
---

# JSDoc Instructions

Defines JSDoc documentation standards for JavaScript files to ensure consistent,
linting-compliant documentation with IDE support.

## Principles

1. **Complete Coverage**: All public functions, methods, and classes require
   full JSDoc with description, `@param`, `@returns`, and `@throws`
2. **Private Method Documentation**: All `#private` methods require at least a
   description comment
3. **Interface Types**: Use interface types from packages, not concrete class
   unions
4. **Accuracy**: JSDoc must match implementation exactly - no outdated types

## Requirements

### JSDoc Structure

All public functions include in order: description, `@param`, `@returns`,
`@throws`:

```javascript
/**
 * Performs operation on input data
 * @param {string} id - Unique identifier
 * @param {Object} options - Configuration options
 * @returns {Promise<Result>} Operation result
 * @throws {Error} When validation fails
 */
async function process(id, options) {
  /* ... */
}
```

### Private Methods

Private methods require at least a single-line description:

```javascript
class Service {
  /** Validates input before processing */
  #validate(input) {
    /* ... */
  }

  /**
   * Complex private method with full docs (optional but recommended)
   * @param {string[]} items - Items to process
   * @returns {Map<string, Object>} Processed items
   */
  #processItems(items) {
    /* ... */
  }
}
```

### Interface Types

Use `import("@package").Interface` syntax for dependency types:

```javascript
/**
 * @param {import("@pkg/storage").StorageInterface} storage - Storage backend
 */
constructor(storage) { /* ... */ }
```

For frequently-used interfaces, use file-level `@typedef`:

```javascript
/** @typedef {import("@pkg/storage").StorageInterface} StorageInterface */
```

### Function Parameters

Function parameters use TypeScript-style signatures:

```javascript
/**
 * @param {(key: string, opts?: Object) => Promise<Data>} fetchFn - Data fetcher
 */
```

### @typedef Placement

- **File level**: Imported interfaces and complex types used multiple times
- **Inline**: Types used only once, adjacent to the function

```javascript
// File level - used throughout
/** @typedef {Object} Config
 * @property {string} name
 * @property {number} port
 */

// Inline - single use only
/** @param {{ id: string, value: number }} item */
function process(item) {
  /* ... */
}
```

## Prohibitions

1. **DO NOT** omit `@param` or `@returns` annotations on public functions
2. **DO NOT** leave `#private` methods without at least a description
3. **DO NOT** use concrete class unions (`ClassA|ClassB`) when interface exists
4. **DO NOT** use vague descriptions ("handles stuff", "does things")
5. **DO NOT** use bare `Function` type - specify full signature
6. **DO NOT** place file-level `@typedef` inline if used multiple times
7. **DO NOT** commit code with ESLint JSDoc warnings
