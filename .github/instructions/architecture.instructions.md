---
applyTo: "**"
---

# Architecture Instructions

## Purpose Declaration

This file provides comprehensive architectural guidance for all files in this
project to ensure consistent adherence to the microservices-based, gRPC-enabled
platform design with proper service organization and communication patterns.

## Core Principles

1. **Microservices Architecture**: Every service must follow
   single-responsibility principle with clear boundaries
2. **gRPC Communication**: All inter-service communication must use gRPC with
   Protocol Buffers for type safety
3. **Framework-Agnostic Packages**: All code in `/packages` must be
   framework-independent and reusable
4. **Service Isolation**: Services must be stateless and maintain no persistent
   connections between requests
5. **Parallel Processing**: Operations must be designed for concurrent execution
   where possible

## Implementation Requirements

### Directory Structure Requirements

```
./services/         # gRPC services only
./extensions/       # REST API adapters only
./packages/         # Framework-agnostic logic only
./tools/            # Development utilities only
./data/             # Static definitions and indices only
./proto/            # Protocol Buffer schemas only
```

### Service Structure Pattern

Every service must follow this exact structure:

```javascript
/* eslint-env node */
import { Service } from "@copilot-ld/libservice";

// Service configuration
const service = new Service("service-name");

// Service implementation class
class ServiceImplementation {
  constructor(config, dependencies) {
    this.config = config;
    this.dependencies = dependencies;
  }

  // gRPC method implementations
  async methodName(request, callback) {
    try {
      const result = await this.processRequest(request);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  }
}

// Service startup
await service.start();
```

### Package Export Pattern

All packages must export through a main `index.js` with interface definitions:

```javascript
// External imports first
import thirdPartyLibrary from "library";

// Internal imports second (alphabetical)
import { helperFunction } from "./helpers/index.js";
import { PackageInterface } from "./types.js";

// Implementation
export class PackageImplementation extends PackageInterface {
  method() {
    // Implementation
  }
}

// Re-exports (including interface)
export { PackageInterface, helperFunction };
```

### Protocol Buffer Schema Requirements

All .proto files must define complete service interfaces:

```protobuf
syntax = "proto3";

package copilot-ld.servicename;

service ServiceName {
  rpc MethodName(MethodRequest) returns (MethodResponse);
}

message MethodRequest {
  string field_name = 1;
  repeated string array_field = 2;
}

message MethodResponse {
  string result = 1;
  int32 status_code = 2;
}
```

## Best Practices

### Service Communication Patterns

Agent service must coordinate all operations through parallel execution:

```javascript
class AgentService {
  constructor(historyService, llmService, vectorService) {
    this.historyService = historyService;
    this.llmService = llmService;
    this.vectorService = vectorService;
  }

  async processRequest(request) {
    // Parallel operations
    const [historyData, embeddings] = await Promise.all([
      this.historyService.getHistory(request),
      this.llmService.createEmbeddings(request.query),
    ]);

    // Direct vector query (no scope resolution needed)
    const vectorResults = await this.vectorService.queryItems(embeddings);

    return { chunks: vectorResults.chunks, usage: vectorResults.usage };
  }
}
```

### File Organization Standards

Import order requirements:

```javascript
/* eslint-env node */
// 1. External libraries (alphabetical)
import grpc from "@grpc/grpc-js";
import NodeCache from "node-cache";

// 2. Internal packages (alphabetical)
import { Config } from "@copilot-ld/libconfig";
import { Service } from "@copilot-ld/libservice";

// 3. Local imports (relative paths, alphabetical)
import { DatabaseInterface } from "./types.js";
```

### Network Isolation Requirements

- **Backend services**: Must be on internal network only, no host port exposure
- **Extensions**: Must bridge external and internal networks
- **External APIs**: Must be accessed only through dedicated service clients

## Explicit Prohibitions

### Forbidden Architectural Patterns

1. **DO NOT** create direct dependencies between backend services (must go
   through Agent)
2. **DO NOT** expose backend service ports to the host network
3. **DO NOT** use REST for inter-service communication (gRPC only)
4. **DO NOT** maintain state within service instances
5. **DO NOT** create circular dependencies between packages
6. **DO NOT** put framework-specific code in `/packages` directory
7. **DO NOT** bypass the Agent service for complex multi-service operations

### Alternative Approaches

- Instead of direct service calls → Route through Agent service orchestration
- Instead of REST inter-service → Use gRPC with Protocol Buffers
- Instead of stateful services → Design for stateless request processing
- Instead of framework coupling → Create framework-agnostic abstractions

## Comprehensive Examples

### Complete Service Implementation

```javascript
/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { Config } from "@copilot-ld/libconfig";

const config = new Config();
const service = new Service("vector");

class VectorService {
  constructor(config, vectorIndices) {
    this.config = config;
    this.vectorIndices = vectorIndices;
  }

  async queryItems(request, callback) {
    try {
      const { embedding, threshold, limit, indices } = request;

      if (!embedding || embedding.length === 0) {
        throw new Error("Invalid embedding");
      }

      const results = await this.queryIndices(
        this.vectorIndices,
        embedding,
        threshold,
        limit,
        indices,
      );

      callback(null, { items: results.items, total: results.total });
    } catch (error) {
      console.error("Vector query error:", error);
      callback(error);
    }
  }

  async queryIndices(indices, embedding, threshold, limit, requestedIndices) {
    const targetIndices = requestedIndices || Object.keys(indices);

    const promises = targetIndices
      .filter((name) => indices[name])
      .map((name) => indices[name].queryItems(embedding, threshold, limit));

    const results = await Promise.all(promises);
    const allItems = results.flat();
    const sortedItems = allItems.sort((a, b) => b.score - a.score);

    return {
      items: sortedItems.slice(0, limit),
      total: allItems.length,
    };
  }
}
```

### Complete Package Implementation

```javascript
/* eslint-env node */
export class CacheInterface {
  async get(key) {
    throw new Error("Not implemented");
  }

  async set(key, value, ttl) {
    throw new Error("Not implemented");
  }

  async delete(key) {
    throw new Error("Not implemented");
  }
}

export class MemoryCache extends CacheInterface {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.ttls = new Map();
    this.defaultTtl = options.defaultTtl || 3600000;
  }

  async get(key) {
    if (this.isExpired(key)) {
      await this.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key, value, ttl) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + (ttl || this.defaultTtl));
  }

  async delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  isExpired(key) {
    const ttl = this.ttls.get(key);
    return ttl && Date.now() > ttl;
  }
}

export class PersistentCache extends CacheInterface {
  constructor(storage, options = {}) {
    super();
    this.storage = storage;
    this.defaultTtl = options.defaultTtl || 3600000;
  }

  async get(key) {
    const value = await this.storage.get(key);
    return value || null;
  }

  async set(key, value, ttl) {
    await this.storage.set(key, value, ttl || this.defaultTtl);
  }

  async delete(key) {
    await this.storage.delete(key);
  }
}

export function createCache(type, storage, options) {
  switch (type) {
    case "memory":
      return new MemoryCache(options);
    case "persistent":
      if (!storage) {
        throw new Error("Storage backend required for persistent cache");
      }
      return new PersistentCache(storage, options);
    default:
      throw new Error(`Unsupported cache type: ${type}`);
  }
}
```

### Complete Extension Implementation

```javascript
import express from "express";
import grpc from "@grpc/grpc-js";
import { Config } from "@copilot-ld/libconfig";
import { AgentServiceClient } from "../proto/agent_grpc_pb.js";

const config = new Config();
const app = express();

const agentClient = new AgentServiceClient(
  "agent:3000",
  grpc.credentials.createInsecure(),
);

app.use(express.json({ limit: "10mb" }));

app.post("/api/query", async (req, res) => {
  try {
    const grpcRequest = {
      query: req.body.query,
      messages: req.body.messages || [],
      userId: req.body.userId,
      sessionId: req.body.sessionId || generateSessionId(),
      options: {
        limit: req.body.limit || 10,
        threshold: req.body.threshold || 0.1,
      },
    };

    const grpcResponse = await new Promise((resolve, reject) => {
      agentClient.processRequest(grpcRequest, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    res.json({
      status: "success",
      data: {
        response: grpcResponse.response,
        chunks: grpcResponse.chunks,
        usage: grpcResponse.usage,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.listen(config.port(), () => {
  console.log(`Web extension listening on port ${config.port()}`);
});

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}
```
