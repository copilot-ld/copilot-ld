---
applyTo: "**/*.js"
---

# JSDoc Instructions

## Purpose Declaration

This file defines comprehensive JSDoc documentation standards for all JavaScript
files in this project to ensure consistent, accurate, and linting-compliant
documentation that provides excellent IDE support and maintains interface-based
documentation contracts.

## Core Principles

1. **Interface-Based Documentation**: All documentation must be written on
   `*Interface` classes only, implementation classes use @inheritdoc exclusively
2. **Single Source of Truth**: Documentation is maintained in interface classes
   to prevent duplication and inconsistency
3. **Accuracy Requirement**: JSDoc must match implementation exactly - no
   outdated or incorrect documentation allowed
4. **Consistent Format**: Follow standardized patterns across all files for
   uniform developer experience
5. **Complete Coverage**: All public functions, methods, and classes must have
   comprehensive JSDoc documentation

## Implementation Requirements

### Interface Class Requirements

All packages must provide an `*Interface` base class for their main
functionality:

```javascript
/**
 * Base interface for storage implementations
 */
export class StorageInterface {
  /**
   * Store data with the given key
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to store
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async put(key, data) {
    throw new Error("Not implemented");
  }
}
```

### Implementation Class Requirements

Implementation classes extending interfaces must use @inheritdoc for all
interface methods:

```javascript
/**
 * Storage interface definition
 */
export class StorageInterface {
  /**
   * Store data with a key
   * @param {string} key - The storage key
   * @param {*} data - The data to store
   * @returns {Promise<void>}
   */
  async put(key, data) {
    throw new Error("Not implemented");
  }
}

/**
 * File system storage implementation
 * @implements {StorageInterface}
 */
export class FileStorage extends StorageInterface {
  /** @inheritdoc */
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
// Top of file - for types used throughout the file
/** @typedef {import("@copilot-ld/libtype").ChunkInterface} ChunkInterface */
/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

// Generic object shapes
/** @typedef {Object} ProcessRequestParams
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

### @inheritdoc Usage Guidelines

1. **Interface Classes**: Contain complete JSDoc documentation with
   descriptions, @param, @returns, and @throws
2. **Implementation Classes**: Use only `/** @inheritdoc */` for all methods
   that implement interface methods
3. **Constructor Exceptions**: Implementation class constructors may have their
   own documentation if parameters differ from interface
4. **Private Methods**: Implementation-specific private methods may have their
   own documentation

### Package Organization Recommendations

1. **libtype package**: Contains only truly common types (Chunk, Message,
   Embedding, Similarity, Usage, Choice)
2. **Other packages**: Each contains their own `*Interface` classes at the top
   of main files
3. **Services**: Each contains their service-specific `*Interface` classes

### Type Documentation Best Practices

- Use specific types rather than generic Object when possible
- Include property descriptions for complex object types
- Specify array element types: `string[]` not `Array`
- Use union types when appropriate: `string|number`
- **Function Parameter Signatures**: Always declare complete function signatures
  for function parameters including input parameters, return types, and optional
  parameters using TypeScript-style syntax

## Explicit Prohibitions

### Forbidden Documentation Practices

1. **DO NOT** duplicate documentation between interface and implementation
   classes
2. **DO NOT** use outdated or incorrect parameter types in JSDoc
3. **DO NOT** omit @param annotations for any parameter
4. **DO NOT** omit @returns annotations for non-void functions
5. **DO NOT** use vague descriptions like "does something" or "handles stuff"
6. **DO NOT** use generic Function types without detailed signatures
7. **DO NOT** place @typedef at function level if used in multiple places
8. **DO NOT** commit code with ESLint JSDoc warnings

### Alternative Approaches

- Instead of duplicated docs → Use @inheritdoc in implementation classes
- Instead of generic types → Use specific interface types from libtype or local
  `*Interface` classes
- Instead of missing annotations → Complete all required JSDoc elements
- Instead of vague descriptions → Write clear, specific behavior descriptions
- Instead of generic Function types → Use detailed function signatures with
  TypeScript-style syntax

## Comprehensive Examples

### Complete Interface Documentation

```javascript
/**
 * Interface for vector similarity search operations
 */
export class VectorInterface {
  /**
   * Performs similarity search across vector embeddings
   * @param {number[]} embedding - Query vector embedding array
   * @param {number} threshold - Minimum similarity score (0-1)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Similarity[]>} Array of similarity results ordered by score
   * @throws {Error} When embedding is invalid or search fails
   */
  async queryItems(embedding, threshold, limit) {
    throw new Error("Not implemented");
  }

  /**
   * Adds or updates a vector item in the index
   * @param {string} id - Unique identifier for the vector
   * @param {number[]} embedding - Vector embedding array
   * @param {Object} metadata - Additional metadata for the vector
   * @returns {Promise<void>}
   * @throws {Error} When vector data is invalid
   */
  async addItem(id, embedding, metadata) {
    throw new Error("Not implemented");
  }
}
```

### Implementation with @inheritdoc

```javascript
/**
 * Vector interface definition
 */
export class VectorInterface {
  /**
   * Adds or updates a vector item in the index
   * @param {string} id - Unique identifier for the vector
   * @param {number[]} embedding - Vector embedding array
   * @param {Object} metadata - Additional metadata for the vector
   * @returns {Promise<void>}
   * @throws {Error} When vector data is invalid
   */
  async addItem(id, embedding, metadata) {
    throw new Error("Not implemented");
  }
}

/**
 * In-memory vector index implementation
 * @implements {VectorInterface}
 */
export class VectorIndex extends VectorInterface {
  /**
   * Creates a new vector index with optional storage backend
   * @param {StorageInterface} storage - Storage backend for persistence
   */
  constructor(storage) {
    super();
    this.storage = storage;
    this.vectors = new Map();
  }

  /** @inheritdoc */
  async queryItems(embedding, threshold, limit) {
    // Implementation details...
    const results = [];
    for (const [id, vector] of this.vectors) {
      const similarity = this.#calculateSimilarity(embedding, vector.embedding);
      if (similarity >= threshold) {
        results.push({ id, similarity });
      }
    }
    return results.slice(0, limit);
  }

  /** @inheritdoc */
  async addItem(id, embedding, metadata) {
    // Implementation details...
  }

  /**
   * Private method for calculating similarity scores
   * @param {number[]} a - First vector
   * @param {number[]} b - Second vector
   * @returns {number} Cosine similarity score
   * @private
   */
  #calculateSimilarity(a, b) {
    // Private implementation...
    return 0.5; // placeholder
  }
}
```

### Complex Parameter Documentation

```javascript
/**
 * Processes agent request with multiple service integrations
 * @param {Object} request - Complete request object
 * @param {string} request.query - User query text
 * @param {string} request.userId - Unique user identifier
 * @param {string} request.sessionId - Session identifier for context
 * @param {Message[]} request.messages - Conversation history
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
 * @param {() => {grpc: object, protoLoader: object}} grpcFn - gRPC libraries factory function
 * @param {(serviceName: string) => object} authFn - Authentication factory function
 * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - LLM client factory
 * @param {(token: string) => object} octokitFactory - Octokit client factory function
 * @returns {Promise<ServiceInterface>} Configured service instance
 * @throws {Error} When configuration is invalid
 */
async function createService(
  name,
  config,
  storageFn,
  grpcFn,
  authFn,
  llmFactory,
  octokitFactory,
) {
  // Implementation...
}
```

### @typedef Complex Types

```javascript
/** @typedef {import("@copilot-ld/libtype").ChunkInterface} ChunkInterface */
/** @typedef {import("@copilot-ld/libtype").MessageInterface} MessageInterface */

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
 * @returns {Promise<AgentService>} Configured agent service
 * @throws {Error} When configuration is invalid
 */
async function createAgentService(config) {
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
