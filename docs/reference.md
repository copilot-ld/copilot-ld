---
title: Implementation Reference
description: |
  Detailed implementation information for developers working with or extending
  Copilot-LD. This guide covers service internals, package APIs, code
  generation, security implementation, and build processes.
toc: true
---

## Service Implementations

### Agent Service

Central orchestrator that autonomously decides what tool calls to make and when.
Requests are processed sequentially per request (readiness checks run in
parallel). The service is built as a thin gRPC wrapper around business logic in
the `@copilot-ld/libagent` package.

**Core Components**:

- **AgentMind**: Handles conversation setup, planning, and context assembly
- **AgentHands**: Executes tool calls and manages the tool calling loop

**Architecture**:

- **Business logic library**: Core logic in `@copilot-ld/libagent` for
  framework-agnostic orchestration
- **Service adapter pattern**: gRPC service delegates to `AgentMind` while
  handling authentication and communication
- **Resource integration**: Direct access to `ResourceIndex` with policy-based
  filtering
- **Testability**: Business logic can be unit tested without service
  infrastructure

<details>
<summary>Message Assembly and Budgeting</summary>

- **Assembly order**: `assistant` → `tasks` → `tools` → `history`
- **Budgeting formula**:
  `effective_budget = max(0, config.budget.tokens - assistant.content.tokens)`
- **Allocation**: Optional shaping for `tools` and `history` portions
- **Autonomous decisions**: Agent decides which tools to call without hard-wired
  dependencies

</details>

### Memory Service

Manages conversation memory using JSONL (newline-delimited JSON) storage for
efficient appends. Provides memory windows with intelligent budget allocation.
Built as a gRPC wrapper around `@copilot-ld/libmemory`.

**Key Operations**:

- `Append`: Adds resource identifiers with automatic deduplication
- `Get`: Returns memory window with budget-filtered tools and history

**Architecture**:

- **Core classes**: `MemoryWindow`, `MemoryIndex`, `MemoryFilter`
- **Per-resource isolation**: Each conversation has its own index and window
- **On-demand initialization**: Windows created and cached as needed
- **Network coordination**: Request locks ensure consistency during concurrent
  ops
- **`IndexInterface` compliance**: Implements standard interface with `add()`,
  `get()`, `has()`, and `queryItems()`
- **JSONL storage**: Append-only format for efficient operations

### LLM Service

Interfaces with language models for embedding generation and text completion.
Handles communication with external AI services (GitHub Copilot, OpenAI, etc.).

**Key Operations**:

- `CreateEmbeddings`: Generates vector embeddings from text
- `CreateCompletions`: Generates conversational responses

**Implementation**:

- **Provider abstraction**: Supports multiple LLM providers
- **Batch processing**: Optimizes API calls for embedding generation
- **Error handling**: Graceful degradation on API failures

### Vector Service

Performs text-based similarity search operations against dual vector indexes
(content and descriptor). Returns content strings directly for immediate use.

**Key Operations**:

- `QueryByContent`: Searches content index, returns matching content strings
- `QueryByDescriptor`: Searches descriptor index, returns matching descriptors

**Architecture**:

- **Text-based interface**: Accepts text, handles embedding internally via LLM
- **Dual-index system**: Separate content and descriptor indexes
- **Direct content return**: Returns strings, not just identifiers
- **Resource integration**: Uses `ResourceIndex` internally
- **In-memory operations**: Fast cosine similarity computation

### Graph Service

Performs pattern-based queries against knowledge graphs using RDF graph
patterns. Enables semantic search and ontology exploration.

**Key Operations**:

- `QueryByPattern`: Queries using subject, predicate, object patterns with
  wildcards
- `GetOntology`: Returns dataset ontology for query planning

**Architecture**:

- **RDF graph patterns**: Uses N3 store with SPARQL-like semantics
- **Resource integration**: Returns identifiers compatible with `ResourceIndex`
- **Ontology support**: Provides dataset structure information
- **Wildcard matching**: Null values act as wildcards in patterns

### Tool Service

Acts as a gRPC proxy between LLM tool calls and actual implementations. Supports
configuration-driven endpoint mapping to extend the platform with custom tools.

**Key Operations**:

- `Call`: Proxies tool calls to appropriate services via configuration
- `ListTools`: Returns OpenAI-compatible tool schemas for LLM

**Architecture**:

- **Configuration-driven**: Tools defined via YAML configuration
- **Pure proxy**: No business logic, only routing and protocol conversion
- **Extensible**: Maps to existing services or custom tool implementations
- **Schema generation**: Auto-generates JSON schemas from protobuf types

## Package Catalog

Business logic packages (`@copilot-ld/lib*`) provide framework-agnostic
functionality that can be used in services, CLI tools, or other applications.

### Core Packages

- **@copilot-ld/libagent**: Agent orchestration logic (`AgentMind`,
  `AgentHands`)
- **@copilot-ld/libmemory**: Conversation memory management (`MemoryWindow`,
  `MemoryIndex`)
- **@copilot-ld/libvector**: Vector similarity operations and indexing
- **@copilot-ld/libgraph**: RDF graph operations and ontology management
- **@copilot-ld/libresource**: Resource management with policy filtering
- **@copilot-ld/libpolicy**: Policy-based access control

### Infrastructure Packages

- **@copilot-ld/librpc**: gRPC service infrastructure and clients
- **@copilot-ld/libtype**: Generated Protocol Buffer types
- **@copilot-ld/libcodegen**: Code generation from protobuf schemas
- **@copilot-ld/libstorage**: Storage abstraction (local, S3)
- **@copilot-ld/libconfig**: Configuration loading and validation
- **@copilot-ld/libindex**: Base index class for storage-backed indexes

### Utility Packages

- **@copilot-ld/libformat**: Formatting and serialization
- **@copilot-ld/libutil**: Common utilities and helpers
- **@copilot-ld/libcopilot**: GitHub Copilot integration
- **@copilot-ld/libweb**: Web server utilities
- **@copilot-ld/librepl**: REPL and CLI utilities
- **@copilot-ld/libperf**: Performance testing utilities

## Code Generation

The platform uses centralized code generation to produce type-safe JavaScript
from Protocol Buffer schemas. The `@copilot-ld/libcodegen` package handles all
generation.

### Generation Process

- **Setup**: Creates `generated/` directory with storage symlinks
- **Schema Discovery**: Scans `proto/` for core services and `tools/` for
  extensions
- **Type Generation**: Creates consolidated JavaScript types with JSDoc
- **Service Generation**: Produces base classes and typed clients
- **Definition Pre-compilation**: Generates runtime-ready gRPC service
  definitions
- **Package Integration**: Creates symlinks for access via `@copilot-ld/libtype`
  and `@copilot-ld/librpc`

### Output Structure

```
./generated/
├── proto/              # Copied .proto files for runtime loading
├── types/
│   └── types.js        # Consolidated protobuf types
├── services/
│   ├── exports.js      # Aggregated service/client exports
│   ├── agent/
│   │   ├── service.js  # Base class
│   │   └── client.js   # Typed client
│   └── definitions/
│       ├── agent.js    # Pre-compiled service definition
│       └── exports.js  # Definition exports
└── bundle.tar.gz       # Compressed archive

# Package symlinks (created at service startup)
./packages/libtype/generated/  → ./generated/
./packages/librpc/generated/   → ./generated/
```

### Code Generation Commands

```bash
# Generate everything (recommended)
npm run codegen

# Generate specific components
npm run codegen:type        # Types only
npm run codegen:service     # Service base classes
npm run codegen:client      # Client classes
npm run codegen:definition  # Service definitions
```

### Factory Function Pattern

        Packages provide factory functions for simplified component creation:

```javascript
/* eslint-env node */
import { createGraphIndex } from "@copilot-ld/libgraph";
import { createResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";

// Create with defaults (storage prefix "graphs")
const graphIndex = createGraphIndex("graphs");
const resourceIndex = createResourceIndex("resources");

// Advanced customization
const policy = new Policy();
const customResourceIndex = createResourceIndex("resources", policy);
```

### Enhanced Content Representation

The `resource.Content` message supports multiple formats:

```protobuf
message Content {
  int32 tokens = 1;
  optional string text = 2;     // Plain text
  optional string nquads = 3;   // RDF N-Quads
  optional string jsonld = 4;   // JSON-LD
}
```

This enables both semantic graph processing and traditional text operations on
the same resource.

## Security Implementation

### Authentication Mechanisms

#### Service Authentication

All inter-service communication uses HMAC-based authentication with time-limited
tokens:

- **Token Generation**: Service creates payload with ID and timestamp
- **Signing**: Payload signed with shared secret using HMAC
- **Transmission**: Token attached to gRPC metadata headers
- **Verification**: Receiving service validates signature and timestamp
- **Expiration**: Tokens expire after configured lifetime

#### Token Lifecycle

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
// Token generation (simplified)
const serviceId = "agent";
const timestamp = Date.now();
const sharedSecret = process.env.SERVICE_SECRET;
const payload = `${serviceId}:${timestamp}`;
const signature = hmac(sharedSecret, payload);
const token = `${payload}:${signature}`;

// Token verification (simplified)
const [receivedServiceId, receivedTimestamp, receivedSignature] =
  token.split(":");
const expectedSignature = hmac(
  sharedSecret,
  `${receivedServiceId}:${receivedTimestamp}`,
);
const isValid =
  secureCompare(receivedSignature, expectedSignature) &&
  !isExpired(receivedTimestamp);
```

### Communication Security

#### gRPC Internal Communication

- **Protocol**: gRPC with Protocol Buffers
- **Authentication**: HMAC signatures on every request
- **Token Lifetime**: Configurable short-lived duration
- **Secret Management**: Shared secret from environment
- **Schema Validation**: Automatic message validation

#### External API Communication

- **Client to Extensions**: HTTP/HTTPS via load balancer
- **LLM Service to APIs**: HTTPS with API key authentication

### Threat Model

#### Protected Against

- **External Access**: Backend services isolated in Docker network
- **Service Impersonation**: HMAC prevents unauthorized access
- **Token Replay**: Time-limited tokens minimize replay windows
- **Request Forgery**: HMAC signatures prevent tampering

#### Known Limitations

- **Shared Secret Exposure**: Compromised secret bypasses authentication
- **Container Compromise**: Attacker gains access to shared secret
- **No mTLS**: gRPC communication not encrypted between services
- **No Rate Limiting**: Extensions must implement their own
- **Extension Security**: Primary attack surface requiring validation

### Security Responsibilities by Layer

#### Extensions

- Input validation and sanitization
- Rate limiting and DDoS protection
- Session management
- CORS policy enforcement

#### Agent Service

- Request orchestration security
- Service-to-service authentication enforcement
- Business logic security validation

#### Backend Services

- gRPC message validation
- Resource usage limiting
- Data access controls
- Error handling without information disclosure

## Docker Build Process

### Unified Dockerfile

The platform uses a single parameterized Dockerfile that builds any service or
extension. Use the `npm run docker:build` command to build all images with
proper environment configuration:

```bash
# Build all services and extensions with environment variables
npm run docker:build
```

This command uses `env-cmd` to load variables from `.env.build`, which must be
configured with a `GITHUB_TOKEN` that has `read:packages` permission to access
GitHub package registry dependencies.

**Environment Configuration**:

Create `.env.build` with required token:

```bash
GITHUB_TOKEN=ghp_your_token_with_read_packages_permission
```

### Build Process

- **Base Stage**: Install Node.js and system dependencies
- **Dependencies**: Copy `package.json` and install packages with GitHub
  registry access
- **Source Copy**: Copy application code and generated artifacts
- **Runtime Configuration**: Configure service ports and entry points

### Multi-Stage Benefits

- **Small Services**: The images contain only around 20 MB of application code
- **Fast Builds**: Cached layers minimize rebuild time
- **Consistency**: All services built identically
- **Security**: Minimal attack surface in production images

## Development Patterns

### Service Adapter Pattern

Services are thin gRPC adapters around business logic packages. This separation
enables:

- **Unit Testing**: Test business logic without gRPC infrastructure
- **Reusability**: Same logic powers services and CLI tools
- **Framework Independence**: Business logic has no service dependencies

### Index Pattern

Indexes extend `IndexBase` from `@copilot-ld/libindex` and implement the `IndexInterface`:

```javascript
/* eslint-env node */
import { IndexBase } from "@copilot-ld/libindex";

/**
 * @implements {import("@copilot-ld/libindex").IndexInterface}
 */
class CustomIndex extends IndexBase {
  async add(item) {
    // Add item to index
    await this.storage().put(item.id, item);
  }

  async get(ids) {
    // Get items by array of IDs - always returns array
    return await Promise.all(ids.map((id) => this.storage().get(id)));
  }

  async has(id) {
    // Check if item exists
    return await this.storage().exists(id);
  }

  async queryItems(query) {
    // Query and return matching items
    return await this.storage().query(query);
  }
}
```

### Storage Abstraction

The `@copilot-ld/libstorage` package provides unified storage access:

```javascript
/* eslint-env node */
import { createStorage } from "@copilot-ld/libstorage";

// Automatically uses local or S3 based on config
const storage = createStorage();

await storage.write("path/to/file.json", data);
const data = await storage.read("path/to/file.json");
```

## Extension Development

### Creating New Extensions

Extensions are application adapters that expose the platform through different
interfaces:

- **Create Directory**: `extensions/your-extension/`
- **Implement Interface**: REST API, Teams bot, Slack app, etc.
- **Use Agent Client**: Import `@copilot-ld/librpc` to call Agent service
- **Add to Docker**: Ensure unified Dockerfile supports your extension

### Example Extension Structure

```
extensions/your-extension/
├── index.js           # Entry point
├── routes.js          # Request handlers
├── middleware.js      # Authentication, validation
└── package.json       # Extension-specific dependencies
```

## Tool Development

### Creating Custom Tools

Tools extend the platform with custom functionality accessible to the agent:

- **Define Protocol**: Create `tools/your-tool.proto`
- **Implement Service**: Create `tools/your-tool/index.js`
- **Configure Tool**: Add entry to `config/tools.yml`
- **Regenerate Code**: Run `npm run codegen`

### Tool Configuration Example

```yaml
# config/tools.yml
your_tool:
  method: "your-tool.YourTool.Execute"
  request: "your-tool.YourToolRequest"
  purpose: |
    Brief description of what the tool does.
  applicability: |
    When the agent should use this tool.
  instructions: |
    How to use the tool effectively.
```

## Testing Strategies

### Unit Testing

Test business logic packages independently:

```javascript
/* eslint-env node */
import { describe, it } from "node:test";
import assert from "node:assert";
import { AgentMind } from "@copilot-ld/libagent";
import { ServiceConfig } from "@copilot-ld/libconfig";

describe("AgentMind", () => {
  it("assembles context correctly", async () => {
    const mockConfig = await ServiceConfig.create("agent");
    const mind = new AgentMind(mockConfig);
    const conversation = { id: "test-conversation", messages: [] };
    const context = await mind.assembleContext(conversation);
    assert.strictEqual(context.messages.length, 5);
  });
});
```

### Integration Testing

Test service communication:

```javascript
/* eslint-env node */
import { describe, it } from "node:test";
import assert from "node:assert";
import { services } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";

const { AgentClient } = services;

describe("Agent Service", () => {
  it("processes requests end-to-end", async () => {
    const config = await ServiceConfig.create("agent");
    const client = new AgentClient(config);
    const response = await client.ProcessRequest({
      messages: [{ role: "user", content: "test" }],
    });
    assert.ok(response.choices);
  });
});
```

### Performance Testing

Use `@copilot-ld/libperf` for benchmarks:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { benchmark } from "@copilot-ld/libperf";

// Assuming vectorService is already initialized
await benchmark("Vector search", async () => {
  await vectorService.QueryByContent({ text: "test query" });
});
```

## Next Steps

Now that you understand how the system was implemented, start using it:

1. [Configuration Guide](/configuration/) - Set up environment variables and
   YAML configuration
2. [Processing Guide](/processing/) - Transform HTML knowledge into searchable
   resources
3. [Deployment Guide](/deployment/) - Launch with Docker Compose or AWS
   CloudFormation
4. [Development Guide](/development/) - Run locally with live reloading
