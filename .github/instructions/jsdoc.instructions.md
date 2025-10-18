---
applyTo: "**/*.js"
---

# JSDoc Instructions

## Purpose Declaration

This file defines comprehensive JSDoc documentation standards for all JavaScript
files in this project to ensure consistent, accurate, and linting-compliant
documentation that provides excellent IDE support.

## Core Principles

1. **Complete Documentation**: All documentation must be written directly on
   implementation classes with full JSDoc comments
2. **Single Responsibility**: Each class and method has clear, focused
   documentation describing its purpose and behavior
3. **Accuracy Requirement**: JSDoc must match implementation exactly - no
   outdated or incorrect documentation allowed
4. **Consistent Format**: Follow standardized patterns across all files for
   uniform developer experience
5. **Complete Coverage**: All public functions, methods, and classes must have
   comprehensive JSDoc documentation

## Implementation Requirements

### Class Documentation Requirements

All classes must have complete JSDoc documentation on their implementation:

```javascript
/**
 * Storage class for managing data persistence
 */
export class Storage {
  /**
   * Store data with the given key
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to store
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async put(key, data) {
    // Implementation
  }
}
```

### Implementation Class Requirements

Implementation classes must have full documentation directly on methods:

```javascript
/**
 * File system storage implementation
 */
export class FileStorage {
  /**
   * Store data with a key
   * @param {string} key - The storage key
   * @param {any} data - The data to store
   * @returns {Promise<void>}
   */
  async put(key, data) {
    // implementation
  }
}
```

### Required JSDoc Structure

All functions must include these elements in exact order:

1. **Clear description** - Single sentence explaining function purpose
2. **@param annotations** - With types for all parameters
3. **@returns annotations** - With types for return values
4. **@throws annotations** - For error conditions where applicable

**Function Parameter Signatures**: All function parameters must include detailed
signatures showing input parameters, return types, and optional parameters using
TypeScript-style syntax.

```javascript
/**
 * Retrieves chunks by their IDs
 * @param {string[]} ids - Array of chunk IDs to retrieve
 * @returns {Promise<Object<string, ChunkInterface>>} Object with chunk IDs as keys
 * @throws {Error} When chunk retrieval fails
 */
async function getChunks(ids) {
  // implementation
  return {};
}
```

### @typedef Usage Rules

Place @typedef statements according to scope:

```javascript
// Top of file - for imported interfaces used throughout the file
/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

// Top of file - for complex object types used throughout the file
/** @typedef {object} ProcessRequestParams
 * @property {Array} messages - Array of conversation messages
 * @property {string} session_id - Optional session ID
 * @property {string} github_token - GitHub authentication token
 */

// Function-level - only if used in one place
/**
 * Creates a new service
 * @typedef {Object} ServiceOptions
 * @property {string} name - Service name
 * @property {number} port - Service port
 * @param {ServiceOptions} options - Service configuration
 */
function createService(options) {
  return { name: options.name, port: options.port };
}
```

## Best Practices

### Documentation Guidelines

1. **Complete Documentation**: All public methods must have complete JSDoc with
   descriptions, @param, @returns, and @throws annotations
2. **Constructor Documentation**: Constructors must document all parameters with
   types and descriptions
3. **Private Methods**: Private methods should have documentation explaining
   their purpose within the implementation
4. **Consistency**: Use consistent terminology and patterns across similar
   methods

### Type Documentation Best Practices

- Use specific types rather than generic Object when possible
- Import interfaces from packages using `import("@package").InterfaceName`
  syntax
- Prefer interface types over concrete class unions (e.g., `StorageInterface`
  not `LocalStorage|S3Storage`)
- Include property descriptions for complex object types
- Specify array element types: `string[]` not `Array`
- Use union types sparingly and only when necessary: `string|number`
- Use @typedef at file level for frequently used imported interfaces
- **Function Parameter Signatures**: Always declare complete function signatures
  for function parameters including input parameters, return types, and optional
  parameters using TypeScript-style syntax

### Interface Import Patterns

When documenting parameters that accept interfaces from shared packages:

**✅ CORRECT - Use interface types:**

```javascript
/* eslint-disable no-unused-private-class-members */
/**
 * Creates a new ResourceIndex
 * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend for persistence
 * @param {import("@copilot-ld/libpolicy").Policy} policy - Policy engine for access control
 */
class ResourceIndex {
  #storage;
  #policy;

  constructor(storage, policy) {
    if (!storage) throw new Error("storage is required");
    if (!policy) throw new Error("policy is required");
    this.#storage = storage;
    this.#policy = policy;
  }
}
```

**❌ INCORRECT - Concrete class unions:**

```javascript
/**
 * Creates a new ResourceIndex
 * @param {import("@copilot-ld/libstorage").LocalStorage|import("@copilot-ld/libstorage").S3Storage} storage - Storage backend
 */
class ResourceIndex {
  constructor(storage) {
    // This is outdated - use interface type instead
  }
}
```

For frequently used interfaces, use @typedef at file level:

```javascript
/* eslint-disable no-unused-private-class-members */
/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

class Cache {
  #storage;
  constructor(storage) {
    this.#storage = storage;
  }
}

/**
 * Creates a cache instance
 * @param {StorageInterface} storage - Storage backend
 * @returns {Cache} Cache instance
 */
function createCache(storage) {
  return new Cache(storage);
}
```

## Explicit Prohibitions

### Forbidden Documentation Practices

1. **DO NOT** use outdated or incorrect parameter types in JSDoc
2. **DO NOT** omit @param annotations for any parameter
3. **DO NOT** omit @returns annotations for non-void functions
4. **DO NOT** use vague descriptions like "does something" or "handles stuff"
5. **DO NOT** use generic Function types without detailed signatures
6. **DO NOT** place @typedef at function level if used in multiple places
7. **DO NOT** commit code with ESLint JSDoc warnings
8. **DO NOT** use concrete class unions (like `LocalStorage|S3Storage`) when an
   interface is available (use `StorageInterface` instead)

### Alternative Approaches

- Instead of missing docs → Write complete JSDoc for all public methods
- Instead of generic types → Use specific interface types from libtype or
  libstorage
- Instead of concrete class unions → Use interface types like `StorageInterface`
- Instead of missing annotations → Complete all required JSDoc elements
- Instead of vague descriptions → Write clear, specific behavior descriptions
- Instead of generic Function types → Use detailed function signatures with
  TypeScript-style syntax

## Comprehensive Examples

### Complete Class Documentation

```javascript
/**
 * Vector index for similarity search operations
 */
export class VectorIndex {
  /**
   * Performs similarity search across vector embeddings
   * @param {number[]} embedding - Query vector embedding array
   * @param {number} threshold - Minimum similarity score (0-1)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<object[]>} Array of similarity results ordered by score
   * @throws {Error} When embedding is invalid or search fails
   */
  async queryItems(embedding, threshold, limit) {
    // Implementation
  }

  /**
   * Adds or updates a vector item in the index
   * @param {string} id - Unique identifier for the vector
   * @param {number[]} embedding - Vector embedding array
   * @param {object} metadata - Additional metadata for the vector
   * @returns {Promise<void>}
   * @throws {Error} When vector data is invalid
   */
  async addItem(id, embedding, metadata) {
    throw new Error("Not implemented");
  }
}
```

### Complete Implementation Example

```javascript
/**
 * In-memory vector index implementation
 */
export class VectorIndex {
  #storage;
  #vectors;

  /**
   * Creates a new vector index with storage backend
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend for persistence
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
    this.#vectors = new Map();
  }

  /**
   * Performs similarity search across vector embeddings
   * @param {number[]} embedding - Query vector embedding array
   * @param {number} threshold - Minimum similarity score (0-1)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<object[]>} Array of similarity results ordered by score
   */
  async queryItems(embedding, threshold, limit) {
    const results = [];
    for (const [id, vector] of this.#vectors) {
      const similarity = this.#calculateSimilarity(embedding, vector.embedding);
      if (similarity >= threshold) {
        results.push({ id, similarity });
      }
    }
    return results.slice(0, limit);
  }

  /**
   * Loads vector data from storage
   * @returns {Promise<void>}
   */
  async loadData() {
    const data = await this.#storage.get("vectors.json");
    // Process loaded data
  }

  /**
   * Adds or updates a vector item in the index
   * @param {string} id - Unique identifier for the vector
   * @param {number[]} embedding - Vector embedding array
   * @param {object} metadata - Additional metadata for the vector
   * @returns {Promise<void>}
   */
  async addItem(id, embedding, metadata) {
    this.#vectors.set(id, { embedding, metadata });
  }

  /**
   * Private method for calculating similarity scores
   * @param {number[]} a - First vector
   * @param {number[]} b - Second vector
   * @returns {number} Cosine similarity score
   * @private
   */
  #calculateSimilarity(a, b) {
    // Calculate cosine similarity
    return 0.5;
  }
}
```

### Complex Parameter Documentation

```javascript
/**
 * Processes agent request with multiple service integrations
 * @param {object} request - Complete request object
 * @param {string} request.query - User query text
 * @param {string} request.userId - Unique user identifier
 * @param {string} request.sessionId - Session identifier for context
 * @param {object[]} request.messages - Conversation history
 * @param {Object} request.options - Additional processing options
 * @param {number} request.options.limit - Maximum results to return
 * @param {number} request.options.threshold - Similarity threshold
 * @returns {Promise<Object>} Response object with results and metadata
 * @returns {Promise<Object>} response - Response container
 * @returns {Promise<string>} response.status - Processing status
 * @returns {Promise<Chunk[]>} response.chunks - Retrieved chunks
 * @returns {Promise<Usage>} response.usage - Token usage information
 * @throws {Error} When request validation fails
 * @throws {Error} When service communication fails
 */
async function processRequest(request) {
  // Implementation...
}
```

### Function Parameter Signature Documentation

All function parameters must include detailed signatures with TypeScript-style
syntax:

```javascript
/**
 * Creates a service instance with dependency injection
 * @param {string} name - Service name identifier
 * @param {object} config - Configuration object
 * @param {(bucket: string, type?: string, process?: object) => StorageInterface} storageFn - Storage factory function
 * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - LLM client factory
 * @param {(token: string) => object} octokitFactory - Octokit client factory function
 * @param {(namespace: string) => LoggerInterface} logFn - Logger factory function
 * @returns {Promise<ServiceInterface>} Configured service instance
 * @throws {Error} When configuration is invalid
 */
async function createService(
  name,
  config,
  storageFn,
  llmFactory,
  octokitFactory,
  logFn,
) {
  // Implementation...
}
```

### @typedef Complex Types

```javascript
// Imported interface typedef for reuse throughout file
/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

/**
 * Configuration for agent service initialization
 * @typedef {Object} AgentConfig
 * @property {string} name - Service instance name
 * @property {number} port - gRPC server port
 * @property {Object} services - Dependent service configurations
 * @property {string} services.vector - Vector service endpoint
 * @property {string} services.history - History service endpoint
 * @property {Object} auth - Authentication configuration
 * @property {string} auth.secret - HMAC authentication secret
 * @property {number} auth.timeout - Token timeout in seconds
 */

/**
 * Creates configured agent service instance
 * @param {AgentConfig} config - Service configuration
 * @param {StorageInterface} storage - Storage backend for persistence
 * @returns {Promise<AgentService>} Configured agent service
 * @throws {Error} When configuration is invalid
 */
async function createAgentService(config, storage) {
  // Implementation...
}
```

### ESLint Integration Notes

ESLint validates:

- All functions have complete JSDoc documentation
- @param and @returns annotations are present and accurate
- Interface types are used consistently in JSDoc
- @typedef statements follow placement rules

All linting warnings must be fixed before committing code to ensure consistent
documentation quality across the codebase.
