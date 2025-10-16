---
applyTo: "**/*.js"
---

# Security Instructions

## Purpose Declaration

This file defines comprehensive security architecture and implementation
requirements for all files in this platform to ensure defense-in-depth security
through network isolation, service authentication, and secure communication
channels.

## Core Principles

1. **Network Isolation**: Backend services must be completely isolated on
   internal Docker networks with no direct external access
2. **Defense in Depth**: Multiple security layers must be implemented including
   network segmentation, authentication, and input validation
3. **Service Authentication**: All service-to-service communication must use
   HMAC-based authentication when enabled
4. **Minimal Attack Surface**: Only extensions should expose external ports, all
   backend services must remain internal
5. **Security by Default**: All security mechanisms must be enabled by default
   with opt-out rather than opt-in configuration

## Implementation Requirements

### Network Configuration Requirements

#### Docker Network Architecture

```yaml
# docker-compose.yml - Required network structure
networks:
  copilot-ld.external:
    driver: bridge
  copilot-ld.internal:
    driver: bridge
    internal: true

services:
  # Extensions - bridge both networks
  web-extension:
    networks:
      - copilot-ld.external
      - copilot-ld.internal
    ports:
      - "3000:3000"

  # Backend services - internal network only
  agent-service:
    networks:
      - copilot-ld.internal
    # NO ports section - internal only
```

#### Service Port Exposure Rules

```javascript
import grpc from "@grpc/grpc-js";

// FORBIDDEN - Backend service port exposure
// ports:
//   - "3001:3000"  // Never expose backend ports

// REQUIRED - Internal network communication only
const grpcServer = new grpc.Server();
grpcServer.bindAsync(
  "0.0.0.0:3000", // Internal container port only
  grpc.ServerCredentials.createInsecure(),
);
```

### Input Validation Requirements

#### gRPC Message Validation

```javascript
function validateRequest(request, schema) {
  const errors = [];
  // Validation logic here
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
}

// Mock function for example
async function processRequest(request) {
  return { result: "processed" };
}

// Usage in service methods
async function serviceMethod(request, callback) {
  try {
    validateRequest(request, {
      required: ["query", "userId"],
      types: { query: "string", userId: "string", limit: "number" },
      maxLengths: { query: 1000, userId: 100 },
    });

    const result = await processRequest(request);
    callback(null, result);
  } catch (error) {
    callback(error);
  }
}
```

## Best Practices

### Extension Security Patterns

#### Input Validation and Rate Limiting

```javascript
/* eslint-env node */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSecurityMiddleware } from "@copilot-ld/libweb";

const app = new Hono();
const security = createSecurityMiddleware({}); // pass real ExtensionConfig in production

// Error, rate limit, and CORS
app.use("*", security.createErrorMiddleware());
app.use("/api/*", security.createRateLimitMiddleware());
app.use(
  "/api/*",
  cors({ origin: ["http://localhost:3000"], allowMethods: ["GET", "POST"] }),
);

// Validation example
app.post(
  "/api/query",
  security.createValidationMiddleware({
    required: ["query", "userId"],
    types: { query: "string", userId: "string", limit: "number" },
    maxLengths: { query: 5000, userId: 100 },
  }),
  async (c) => {
    const data = c.get("validatedData");
    // process request using validated data
    return c.json({ status: "success", data });
  },
);
```

#### CORS Configuration

```javascript
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
  }),
);
```

### Service Security Patterns

#### Secure Error Handling

```javascript
class SecureServiceImplementation {
  async processRequest(request, callback) {
    try {
      const result = await this.businessLogic(request);
      callback(null, result);
    } catch (error) {
      console.error("Service error:", {
        error: error.message,
        request: this.#sanitizeForLogging(request),
      });

      callback(this.#sanitizeError(error));
    }
  }

  #sanitizeError(error) {
    const message = error.message
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]")
      .replace(/[a-zA-Z0-9]{32,}/g, "[TOKEN]");
    return new Error(message);
  }

  #sanitizeForLogging(request) {
    const sanitized = { ...request };
    delete sanitized.authToken;
    delete sanitized.apiKey;
    return sanitized;
  }
}
```

#### Resource Limiting

```javascript
class ResourceLimitedService {
  #activeRequests;
  #maxConcurrentRequests;

  constructor() {
    this.#activeRequests = new Map();
    this.#maxConcurrentRequests = 100;
  }

  async processRequest(request, callback) {
    const requestId = this.#generateRequestId();

    if (this.#activeRequests.size >= this.#maxConcurrentRequests) {
      return callback(new Error("Server overloaded"));
    }

    this.#activeRequests.set(requestId, Date.now());

    try {
      const result = await this.businessLogic(request);
      callback(null, result);
    } finally {
      this.#activeRequests.delete(requestId);
    }
  }

  #generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Explicit Prohibitions

### Forbidden Security Practices

1. **DO NOT** expose backend service ports to the host network under any
   circumstances
2. **DO NOT** use unencrypted communication channels for sensitive data
   transmission
3. **DO NOT** store secrets or credentials in source code or configuration files
4. **DO NOT** trust user input without validation and sanitization
5. **DO NOT** log sensitive information (tokens, passwords, personal data)
6. **DO NOT** implement custom cryptographic functions
7. **DO NOT** ignore SSL certificate validation in production environments

### Alternative Approaches

- Instead of exposed backend ports → Use network bridges through extensions only
- Instead of unencrypted channels → Use secure gRPC communication
- Instead of hardcoded secrets → Use environment variables and secret management
- Instead of trusting input → Implement comprehensive validation and
  sanitization
- Instead of sensitive logging → Sanitize all logged data
- Instead of custom crypto → Use established libraries and patterns

## Comprehensive Examples

### Secure Service Pattern

```javascript
import grpc from "@grpc/grpc-js";
import { Config } from "@copilot-ld/libconfig";

const VectorServiceDefinition = {
  QueryItems: {
    path: "/vector.VectorService/QueryItems",
    requestType: "vector.QueryRequest",
    responseType: "vector.QueryResponse",
  },
};

class SecureVectorService {
  #server;

  constructor(config) {
    if (!config) throw new Error("config is required");
    this.#server = new grpc.Server();
  }

  async queryItems(call, callback) {
    try {
      const { embedding, threshold, limit } = call.request;

      if (!embedding || embedding.length === 0) {
        throw new Error("Invalid embedding");
      }

      const result = await this.#performQuery(embedding, threshold, limit);
      callback(null, result);
    } catch (error) {
      console.error("Query error:", error.message);
      callback(error);
    }
  }

  async #performQuery(embedding, threshold, limit) {
    // Mock implementation
    return { items: [], total: 0 };
  }

  async start() {
    this.#server.addService(VectorServiceDefinition, {
      QueryItems: this.queryItems.bind(this),
    });

    this.#server.bindAsync(
      "0.0.0.0:3000",
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error("Failed to start server:", error);
          process.exit(1);
        }
        console.log(`Service listening on internal port ${port}`);
        this.#server.start();
      },
    );
  }
}
```

### Secure Hono Extension Pattern

```javascript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import validator from "validator";

// Mock function for example
async function processRequest(data) {
  return { result: "processed" };
}

const app = new Hono();

// Security middleware
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST"],
  }),
);

// Input validation
async function validateInput(c, next) {
  const { query, userId } = await c.req.json();

  if (!query || !userId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  c.set("validatedData", {
    query: validator.escape(query),
    userId: validator.escape(userId),
  });

  await next();
}

app.post("/api/query", validateInput, async (c) => {
  try {
    const data = c.get("validatedData");
    const response = await processRequest(data);
    return c.json({ status: "success", data: response });
  } catch (error) {
    console.error("Processing error:", error.message);
    return c.json({ error: "Processing failed" }, 500);
  }
});
```
