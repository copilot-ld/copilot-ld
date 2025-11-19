---
title: Implementation Reference
description: |
  Detailed implementation information for developers working with or extending
  Copilot-LD. This guide covers runtime services, processing pipelines,
  observability infrastructure, and supporting components.
toc: true
---

## Runtime Components

The runtime system consists of gRPC services, communication infrastructure, and
data storage patterns that power the live platform.

### Services

Services are thin gRPC adapters around business logic packages, enabling
framework-independent orchestration and testability.

#### Agent Service

Central orchestrator that autonomously decides what tool calls to make and when.
Requests are processed sequentially per request (readiness checks run in
parallel). Built as a thin gRPC wrapper around `@copilot-ld/libagent`.

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

- **Architecture**: `assistant` → `tasks` → `tools` → `context` → `conversation`
- **Budgeting formula**:
  `effective_budget = max(0, config.budget.tokens - assistant.id.tokens)`
- **Allocation**: Optional shaping for `tools`, `context`, and `conversation`
  portions
- **Autonomous decisions**: Agent decides which tools to call without hard-wired
  dependencies

</details>

#### Memory Service

Manages conversation memory using JSONL (newline-delimited JSON) storage for
efficient appends. Provides memory windows with intelligent budget allocation.
Built as a gRPC wrapper around `@copilot-ld/libmemory`.

**Key Operations**:

- `AppendMemory`: Adds resource identifiers with automatic deduplication
- `GetWindow`: Returns memory window with budget-allocated tools, context, and
  conversation identifiers

**Architecture**:

- **Core classes**: `MemoryWindow`, `MemoryIndex`, `MemoryFilter`
- **Per-resource isolation**: Each conversation has its own index and window
- **On-demand initialization**: Windows created and cached as needed
- **Network coordination**: Request locks ensure consistency during concurrent
  ops
- **`IndexInterface` compliance**: Implements standard interface with `add()`,
  `get()`, `has()`, and `queryItems()`
- **JSONL storage**: Append-only format for efficient operations
- **Budget allocation**: Splits memory into `tools`, `context`, and
  `conversation` portions based on configured ratios

#### LLM Service

Interfaces with language models for embedding generation and text completion.
Handles communication with external AI services (GitHub Copilot, OpenAI, etc.).

**Key Operations**:

- `CreateEmbeddings`: Generates vector embeddings from text
- `CreateCompletions`: Generates conversational responses

**Implementation**:

- **Provider abstraction**: Supports multiple LLM providers
- **Batch processing**: Optimizes API calls for embedding generation
- **Error handling**: Graceful degradation on API failures

#### Vector Service

Performs text-based similarity search operations against a content vector index.
Returns content strings directly for immediate use.

**Key Operations**:

- `SearchContent`: Searches content index, returns matching content strings

**Architecture**:

- **Text-based interface**: Accepts text, handles embedding internally via LLM
- **Single content index**: Vector embeddings of resource content
- **Direct content return**: Returns strings, not just identifiers
- **Resource integration**: Uses `ResourceIndex` internally
- **In-memory operations**: Fast cosine similarity computation

#### Graph Service

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

#### Tool Service

Acts as a gRPC proxy between LLM tool calls and actual implementations. Supports
configuration-driven endpoint mapping to extend the platform with custom tools.

**Key Operations**:

- `CallTool`: Proxies tool calls to appropriate services via configuration
- `ListTools`: Returns OpenAI-compatible tool schemas for LLM

**Architecture**:

- **Configuration-driven**: Tools defined via YAML configuration
- **Pure proxy**: No business logic, only routing and protocol conversion
- **Extensible**: Maps to existing services or custom tool implementations
- **Schema generation**: Auto-generates JSON schemas from protobuf types

#### Trace Service

Collects and stores distributed traces from all services to provide
observability into system behavior. Receives span data via gRPC and persists to
daily JSONL files for analysis.

**Key Operations**:

- `RecordSpan`: Receives and stores individual trace spans
- `QuerySpans`: Retrieves spans with JMESPath query support for flexible
  filtering
- `FlushTraces`: Forces buffered spans to disk

**Architecture**:

- **JMESPath queries**: Filter traces by complex conditions (e.g.,
  `[?kind==\`2\`]` for SERVER spans)
- **Complete trace retrieval**: Returns all spans from matching traces, not
  individual spans
- **Buffered writes**: Uses `BufferedIndex` for efficient batched I/O via
  `TraceIndex`
- **Daily rotation**: Stores traces in `data/traces/YYYY-MM-DD.jsonl` format
- **Self-instrumentation**: Does NOT trace itself to avoid infinite recursion
- **OTLP export**: Optional export to OpenTelemetry Protocol endpoints
- **JSONL format**: One JSON span per line for streaming analysis

**Integration**:

- **Automatic instrumentation**: All gRPC methods automatically create spans
- **Code generation**: Service bases and clients include tracing by default
- **Context propagation**: Uses `AsyncLocalStorage` for parent-child
  relationships
- **Zero-touch**: No manual instrumentation required in service code

### gRPC Communication (librpc)

The `@copilot-ld/librpc` package provides the foundation for all inter-service
communication with automatic tracing integration.

**Core Components**:

- **Server**: Base class for gRPC service implementations
- **Client**: Type-safe client generation for service calls
- **`createClient()`**: Factory function for client instantiation
- **`createTracer()`**: Factory function for distributed tracing setup

**Server Pattern**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { Server, createTracer } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libtelemetry";

const config = await createServiceConfig("agent");
const logger = createLogger("agent");
const tracer = await createTracer("agent");

// Server automatically instruments all RPC methods
// service is your service implementation instance
const server = new Server(service, config, logger, tracer);
await server.start();
```

**Client Pattern**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

const logger = createLogger("agent");
const tracer = await createTracer("agent");

// Client automatically creates spans for all calls
const memoryClient = await createClient("memory", logger, tracer);
// request is your gRPC request object
const response = await memoryClient.GetWindow(request);
```

**Automatic Instrumentation**:

- **Span Creation**: Creates SERVER spans for incoming requests, CLIENT spans
  for outgoing calls
- **Context Propagation**: Injects/extracts trace context via gRPC metadata
- **Event Recording**: Logs request.sent, request.received, response.sent,
  response.received
- **Attribute Extraction**: Captures standard attributes from requests/responses
- **Error Handling**: Sets span status and preserves error information
- **Parent-Child Links**: Maintains trace hierarchy via `AsyncLocalStorage`

### Storage Patterns (libstorage)

The `@copilot-ld/libstorage` package provides unified storage abstraction for
local filesystem and S3-compatible storage.

**Storage Interface**:

```javascript
/* eslint-env node */
import { createStorage } from "@copilot-ld/libstorage";

// Automatically uses local or S3 based on config
const storage = createStorage();

// Write operations
await storage.write("path/to/file.json", data);
await storage.write("path/to/file.txt", "text content");

// Read operations
const data = await storage.read("path/to/file.json");
const text = await storage.read("path/to/file.txt");

// List operations
const files = await storage.list("path/to/directory/");

// Delete operations
await storage.delete("path/to/file.json");
```

**Storage Backends**:

- **Local**: Uses Node.js filesystem APIs with `data/` prefix
- **S3**: Uses AWS SDK with configurable bucket and region
- **Transparent**: Same API regardless of backend

**Configuration**:

- `STORAGE_TYPE`: Set to `local` or `s3`
- `S3_BUCKET`: S3 bucket name (required for S3 storage)
- `S3_REGION`: AWS region (required for S3 storage)

### Index Patterns (libindex)

The `@copilot-ld/libindex` package provides the base class for all
storage-backed indexes with a standard interface.

**IndexInterface**:

All indexes implement this interface:

```javascript
/* eslint-env node */
/**
 * @interface IndexInterface
 */
class IndexInterface {
  /**
   * Add item(s) to the index
   * @param {*} item - Item or array of items to add
   * @returns {Promise<void>}
   */
  async add(item) {}

  /**
   * Get items by ID(s) - always returns array
   * @param {string|string[]} ids - Single ID or array of IDs
   * @returns {Promise<Array>}
   */
  async get(ids) {
    return [];
  }

  /**
   * Check if item exists
   * @param {string} id - Item identifier
   * @returns {Promise<boolean>}
   */
  async has(id) {
    return false;
  }

  /**
   * Query items matching criteria
   * @param {*} query - Query parameters
   * @returns {Promise<Array>}
   */
  async queryItems(query) {
    return [];
  }
}
```

**`IndexBase` Pattern**:

Extend `IndexBase` to create custom indexes:

```javascript
/* eslint-env node */
import { IndexBase } from "@copilot-ld/libindex";

/**
 * @implements {import("@copilot-ld/libindex").IndexInterface}
 */
class CustomIndex extends IndexBase {
  constructor(storage, filename) {
    super(storage, filename);
  }

  async add(item) {
    await this.storage().put(item.id, item);
  }

  async get(ids) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    return await Promise.all(idArray.map((id) => this.storage().get(id)));
  }

  async has(id) {
    return await this.storage().exists(id);
  }

  async queryItems(query) {
    return await this.storage().query(query);
  }
}
```

**Built-in Indexes**:

- **VectorIndex**: Cosine similarity search with embeddings
- **GraphIndex**: RDF triple storage with pattern matching
- **ResourceIndex**: Structured resource storage with policy filtering
- **MemoryIndex**: Conversation memory with JSONL format
- **BufferedIndex**: Batched writes for high-throughput operations

**Factory Functions**:

```javascript
/* eslint-env node */
import { createGraphIndex } from "@copilot-ld/libgraph";
import { createResourceIndex } from "@copilot-ld/libresource";
import { VectorIndex } from "@copilot-ld/libvector";
import { createStorage } from "@copilot-ld/libstorage";

// Create with defaults
const graphIndex = createGraphIndex("graphs");
const resourceIndex = createResourceIndex("resources");

// Create with custom storage
const storage = createStorage();
const vectorIndex = new VectorIndex(storage, "vectors/content.jsonl");
```

## Processing Components

Processing components transform raw knowledge into searchable, queryable
resources during offline batch operations.

### Resource Processor (libresource)

The `ResourceProcessor` transforms HTML documents containing Schema.org
microdata into typed `Message` resources stored in the `ResourceIndex`.

**Core Responsibility**:

Batch processes HTML knowledge files into structured resources with RDF union
semantics to merge stub entity references with canonical definitions across
multiple files.

**Processing Pipeline**:

1. **Discover**: Scan knowledge storage for HTML files
2. **Parse**: Extract Schema.org microdata from DOM
3. **Convert**: Transform microdata to RDF quads
   (subject-predicate-object-graph)
4. **Identify**: Generate deterministic hash-based identifiers from entity IRIs
5. **Merge**: Check for existing resources and merge using RDF union
6. **Format**: Convert merged RDF to JSON-LD format
7. **Create**: Build Message resources with string content (JSON-LD format)
8. **Store**: Persist resources in ResourceIndex

**Merging Strategy (RDF Union Semantics)**:

When an entity appears in multiple HTML files:

- Detects existing resources by comparing hash-based identifiers
- Loads existing resource and parses its RDF quads
- Combines existing and new quads using set union (deduplication)
- Only overwrites if new information is added (quad count increases)
- Skips processing if entity already has complete information

This allows stub references (e.g., drug mentioned in article) to be enriched
with canonical definitions (e.g., drug details page) without data loss.

**Usage Example**:

```javascript
/* eslint-env node */
import { ResourceProcessor } from "@copilot-ld/libresource";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";
import { Parser } from "@copilot-ld/libresource";

const storage = createStorage();
const resourceIndex = createResourceIndex("resources");
const logger = createLogger("processor");
const parser = new Parser();
const baseIri = "https://example.com";

const processor = new ResourceProcessor(
  baseIri,
  resourceIndex,
  storage,
  parser,
  null,
  logger,
);

// Process all HTML files in knowledge storage
await processor.process();
```

**Key Design Decisions**:

- Uses SHA-256 hash of entity IRI for deterministic resource naming
- Extends `ProcessorBase` for batch processing with error isolation
- Separates parsing logic (`Parser`) from processing logic (`ResourceProcessor`)
- Stateless processing - no persistent connections between files

### Graph Processor (libgraph)

The `OntologyProcessor` builds a lightweight SHACL shapes graph from observed
RDF quads to provide dataset structure information for query planning.

**Core Responsibility**:

Analyzes RDF quads to generate SHACL `NodeShapes` with `sh:targetClass`,
`sh:property`, `sh:class` constraints, and `sh:inversePath` constraints for
bidirectional navigation.

**Analysis Process**:

1. **Observe Types**: Track `rdf:type` assertions to identify entity classes
2. **Track Predicates**: Record predicate usage patterns per class
3. **Analyze Objects**: Identify object types for predicates
4. **Detect Inverses**: Find bidirectional relationships using ratio analysis
5. **Generate Shapes**: Create SHACL `NodeShapes` with constraints
6. **Format Output**: Serialize as Turtle (TTL) format

**Inverse Relationship Detection**:

The processor identifies inverse predicates by analyzing relationship patterns:

- Calculates forward/reverse ratios for predicate pairs
- Both ratios must be within configured thresholds (default 0.8-1.25)
- Excludes one-way predicates (citations, mentions, references)
- Generates `sh:inversePath` constraints for bidirectional navigation

**Usage Example**:

```javascript
/* eslint-env node */
import { OntologyProcessor } from "@copilot-ld/libgraph";
import { createGraphIndex } from "@copilot-ld/libgraph";
import { createStorage } from "@copilot-ld/libstorage";

const graphIndex = createGraphIndex("graphs");
const processor = new OntologyProcessor();
const storage = createStorage();

// Process all quads from graph index
const quads = await graphIndex.getAllQuads();
for (const quad of quads) {
  processor.processQuad(quad);
}

// Generate SHACL shapes as Turtle
const ontologyTTL = processor.generateShapes();
await storage.write("graphs/ontology.ttl", ontologyTTL);
```

**Configuration**:

- `minInverseRatio`: Minimum ratio threshold for inverse detection (default 0.8)
- `maxInverseRatio`: Maximum ratio threshold for inverse detection (default
  1.25)
- `oneWayPredicates`: Set of predicates excluded from inverse detection

**Output Format**:

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix schema: <https://schema.org/> .

schema:PersonShape a sh:NodeShape ;
  sh:targetClass schema:Person ;
  sh:property [
    sh:path schema:knows ;
    sh:class schema:Person ;
    sh:inversePath schema:knows
  ] .
```

### Batch Processing Pattern (ProcessorBase)

The `ProcessorBase` class from `@copilot-ld/libutil` provides the foundation for
all batch processing operations with error isolation and progress tracking.

**Features**:

- **Error Isolation**: Continues processing even when individual items fail
- **Progress Tracking**: Logs processing status and completion
- **Batch Operations**: Processes collections of items efficiently
- **Extensibility**: Subclasses implement `processItem()` and `processAll()`

**Batch Processing Pattern**:

```javascript
/* eslint-env node */
import { ProcessorBase } from "@copilot-ld/libutil";

class CustomProcessor extends ProcessorBase {
  constructor(logger, batchSize) {
    super(logger, batchSize);
  }

  async processItem(item) {
    // Process single item
    return { success: true, data: item };
  }

  async process(extension = ".html") {
    // Discover and process all items
    const items = await this.discoverItems(extension);
    await super.process(items, "custom-processor");
  }

  async discoverItems(extension) {
    // Custom discovery logic
    return [];
  }
}
```

## Observability Components

The observability system provides comprehensive distributed tracing and logging
for understanding system behavior.

### libtelemetry

The `@copilot-ld/libtelemetry` package provides distributed tracing
infrastructure with OpenTelemetry-compatible span semantics.

#### Tracer

Central tracing coordinator that creates and manages spans with distributed
context propagation.

**Initialization**:

```javascript
/* eslint-env node */
import { Tracer } from "@copilot-ld/libtelemetry/tracer.js";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { clients } from "@copilot-ld/librpc";

const { TraceClient } = clients;
const traceConfig = await createServiceConfig("trace");
const traceClient = new TraceClient(traceConfig);

const tracer = new Tracer({
  serviceName: "agent",
  traceClient: traceClient,
});
```

**Key Methods**:

- `startSpan(name, options)`: Creates a new span with optional parent context
- `startServerSpan(service, method, metadata, attributes)`: Creates SERVER span
  for incoming gRPC calls with automatic trace context extraction
- `startClientSpan(service, method, metadata, attributes, request)`: Creates
  CLIENT span for outgoing gRPC calls with automatic trace context injection
- `getMetadata(metadata, span)`: Extracts trace context and request attributes
  from gRPC metadata
- `setMetadata(metadata, span, request)`: Injects trace context and request
  attributes into gRPC metadata
- `getSpanContext()`: Returns `AsyncLocalStorage` for establishing span context
  hierarchy

**Basic Usage**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
// Start a span
const span = tracer.startSpan("ProcessRequest", {
  kind: "INTERNAL",
  attributes: { "request.id": "123" },
});

// Add attributes and events
span.setAttribute("response.count", 5);
span.addEvent("processing.complete", { items: 5 });

// Set status
span.setStatus({ code: "OK" });

// End span (sends to trace service)
await span.end();
```

#### Span

Represents a unit of work with timing, attributes, events, and relationships.

**Span Structure**:

- `traceId`: Unique identifier shared across all spans in a request
- `spanId`: Unique identifier for this span
- `parentSpanId`: Links to parent span, creating hierarchical trace tree
- `name`: Human-readable operation name (e.g., `agent.ProcessRequest`)
- `kind`: Operation type (`SERVER`, `CLIENT`, `INTERNAL`)
- `startTime` / `endTime`: High-precision timestamps (nanoseconds)
- `attributes`: Key-value metadata for filtering and analysis
- `events`: Timestamped markers with additional context
- `status`: Completion state (`OK`, `ERROR`, `UNSET`)

**Working with Spans**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
const span = tracer.startSpan("LookupUser", {
  kind: "INTERNAL",
  attributes: { "user.id": "abc123" },
  traceId: "parent-trace-id", // Optional: inherit from parent
  parentSpanId: "parent-span-id", // Optional: set parent relationship
});

// Add structured attributes
span.setAttribute("cache.hit", "true");
span.setAttribute("cache.ttl", "3600");

// Add point-in-time events
span.addEvent("cache.lookup", { key: "user:abc123" });
span.addEvent("cache.hit", { size: 1024 });

// Set completion status
span.setStatus({ code: "OK" });
// Or for errors
span.setStatus({ code: "ERROR", message: "Database timeout" });

// Complete and send to trace service
await span.end();
```

#### Observer

Unified coordination layer that integrates logging and tracing for RPC
operations. Handles span lifecycle, event recording, and attribute extraction
automatically.

**Usage**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { createObserver } from "@copilot-ld/libtelemetry";
import { createLogger } from "@copilot-ld/libtelemetry";
import { Tracer } from "@copilot-ld/libtelemetry/tracer.js";

const logger = createLogger("agent");
const tracer = new Tracer({ serviceName: "agent", traceClient });
const observer = createObserver("agent", logger, tracer);

// Observe client call (outgoing)
const clientResponse = await observer.observeClientCall(
  "CreateCompletions",
  request,
  async (metadata) => {
    return await grpcClient.CreateCompletions(request, metadata);
  },
);

// Observe server call (incoming)
const serverResponse = await observer.observeServerCall(
  "ProcessRequest",
  call,
  async (call) => {
    return await agentMind.processRequest(call.request);
  },
);
```

**Automatic Instrumentation**:

- **Span Creation**: Automatically creates CLIENT or SERVER spans
- **Event Recording**: Logs `request.sent`, `request.received`, `response.sent`,
  `response.received` events
- **Attribute Extraction**: Parses standard attributes from
  requests/responses/metadata
- **Context Propagation**: Uses `AsyncLocalStorage` to maintain parent-child
  relationships
- **Error Handling**: Captures errors and sets span status appropriately
- **Timing**: Records precise timing for all operations

#### Logger

Simple namespace-based logger with DEBUG environment variable filtering.

**Usage**:

```javascript
/* eslint-env node */
import { createLogger } from "@copilot-ld/libtelemetry";

const logger = createLogger("agent:memory");

// Only logs if DEBUG=agent:* or DEBUG=* or DEBUG=agent:memory
logger.debug("Retrieved memory window", {
  conversation_id: "abc123",
  item_count: 5,
});

// Output format:
// [2025-10-29T12:34:56.789Z] agent:memory: Retrieved memory window conversation_id=abc123 item_count=5
```

**Environment Variable Control**:

- `DEBUG=*`: Enable all logging
- `DEBUG=agent`: Enable all agent-related logs
- `DEBUG=agent:*`: Enable all agent namespace logs
- `DEBUG=agent:memory,llm`: Enable specific namespaces

### Integration with librpc

The `@copilot-ld/librpc` package integrates telemetry automatically through the
`Observer` pattern.

**Server Integration**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { Server, createTracer } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";

const config = await createServiceConfig("agent");
const tracer = await createTracer("agent");

// Server automatically uses tracer if provided
const server = new Server(service, config, logger, tracer);
await server.start();

// All RPC handlers automatically create SERVER spans
// Trace context extracted from gRPC metadata
// Request/response attributes captured automatically
```

**Client Integration**:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { createClient, createTracer } from "@copilot-ld/librpc";

const tracer = await createTracer("agent");
const memoryClient = await createClient("memory", logger, tracer);

// All RPC calls automatically create CLIENT spans
// Trace context injected into gRPC metadata
// Parent-child relationships maintained via AsyncLocalStorage
const response = await memoryClient.callMethod("Get", request);
```

**Zero-Touch Instrumentation**:

Services using the standard `Server` and `Client` patterns get complete
distributed tracing without manual instrumentation. The `Observer`
automatically:

1. Creates appropriate spans (SERVER/CLIENT)
2. Extracts/injects trace context via metadata
3. Records request.sent/received and response.sent/received events
4. Captures request and response attributes
5. Sets span status based on success/failure
6. Maintains parent-child relationships across services

### OpenTelemetry Compatibility

The tracing implementation follows OpenTelemetry semantic conventions for
compatibility with standard observability tools.

**Span Attributes**:

- `service.name`: Originating service
- `rpc.service`: Target service name
- `rpc.method`: RPC method name
- `resource.id`: Global resource identifier (conversation ID, etc.)
- `request.*`: Request-specific attributes (message count, tool count, etc.)
- `response.*`: Response-specific attributes (resource count, token usage, etc.)

**Span Kinds**:

- `SERVER`: Incoming RPC handling (entry point to service)
- `CLIENT`: Outgoing RPC calls (calls to other services)
- `INTERNAL`: Internal operations without RPC

**Status Codes**:

- `STATUS_CODE_OK`: Successful completion
- `STATUS_CODE_ERROR`: Operation failed
- `STATUS_CODE_UNSET`: Status not explicitly set

**Context Propagation**:

Trace context is propagated via gRPC metadata headers:

- `x-trace-id`: Shared trace identifier
- `x-span-id`: Parent span identifier for creating child spans
- Request attributes: `x-request-messages`, `x-request-tools`, etc.
- Response attributes: Extracted from response objects automatically

**OTLP Export**:

The trace service includes a stub OTLP exporter that can be extended to send
spans to external systems:

```javascript
/* eslint-env node */
// Enable OTLP export via environment variable
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://jaeger:4318";

// Trace service automatically exports spans if endpoint configured
// Stub implementation can be replaced with actual OTLP client
```

**Standard Integration Points**:

- **Jaeger**: OTLP export compatible with Jaeger collector
- **Grafana Tempo**: Direct OTLP ingestion support
- **AWS X-Ray**: Can be integrated via OTLP to X-Ray bridge
- **Datadog**: OTLP receiver available in Datadog Agent
- **Prometheus**: Span metrics can be generated from trace data

### Storage Format

Traces are stored as newline-delimited JSON (JSONL) in
`data/traces/YYYY-MM-DD.jsonl`:

```json
{
  "id": "f91610b972397",
  "trace_id": "f6a4a4d0d3e91",
  "span_id": "f91610b972397",
  "parent_span_id": "",
  "name": "agent.ProcessRequest",
  "kind": 0,
  "start_time_unix_nano": { "low": 884383599, "high": 680 },
  "end_time_unix_nano": { "low": -749323440, "high": 682 },
  "attributes": {
    "service.name": "agent",
    "rpc.service": "agent",
    "rpc.method": "ProcessRequest"
  },
  "events": [
    {
      "name": "request.received",
      "time_unix_nano": "2921462258762",
      "attributes": { "request.messages": "1" }
    },
    {
      "name": "response.sent",
      "time_unix_nano": "2932713336001",
      "attributes": {
        "resource.id": "common.Conversation.abc123",
        "response.usage.total_tokens": "57796"
      }
    }
  ],
  "status": { "message": "" }
}
```

**Storage Characteristics**:

- **Daily rotation**: New file per day for manageable file sizes
- **Streaming friendly**: One JSON object per line enables streaming processing
- **Buffered writes**: `BufferedIndex` batches writes for efficiency
- **Queryable**: Can be loaded back into memory for analysis
- **Standard tools**: Compatible with `jq`, `grep`, and log analysis tools

### Trace Analysis

**Common Analysis Queries**:

```bash
# Count spans by operation type
cat data/traces/2025-10-27.jsonl | jq -r '.name' | sort | uniq -c

# Find all spans for a specific trace
cat data/traces/2025-10-27.jsonl | \
  jq -r 'select(.trace_id == "TRACE_ID")'

# Count spans by service
cat data/traces/2025-10-27.jsonl | \
  jq -r '.attributes["service.name"]' | sort | uniq -c

# Find error spans
cat data/traces/2025-10-27.jsonl | \
  jq -r 'select(.status.message != "")'

# Analyze trace depth (parent-child nesting)
cat data/traces/2025-10-27.jsonl | \
  jq -r '{trace_id, name, parent: .parent_span_id}' | \
  jq -s 'group_by(.trace_id) | map({trace: .[0].trace_id, depth: length})'
```

**Typical Trace Patterns**:

Agent Request Flow (simplified):

```
Agent.ProcessRequest (root)
├── Memory.GetWindow (retrieve conversation resources)
├── Llm.CreateEmbeddings (generate query vector)
├── Vector.QueryByContent (semantic search)
├── Graph.QueryByPattern (knowledge graph query)
├── Tool.CallTool (execute tool)
│   └── Tool.CallTool (nested tool execution)
├── Llm.CreateCompletions (generate response)
└── Memory.AppendMemory (save conversation)
```

Tool Execution Chain:

```
Tool.CallTool (root)
└── Tool.CallTool (recursive depth 1)
    └── Tool.CallTool (recursive depth 2)
        └── Tool.CallTool (recursive depth 3)
            └── ... (up to 9 levels observed)
```

### Trace Query API

Query traces programmatically via the Trace Service gRPC API:

```javascript
/* eslint-env node */
import { TraceClient } from "../../generated/services/trace/client.js";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { trace } from "@copilot-ld/libtype";

const config = await createServiceConfig("trace");
const client = new TraceClient(config);

// Query all spans for a specific trace
const request = trace.QuerySpansRequest.fromObject({
  trace_id: "8c1675ebe7c638",
  limit: 1000,
});
const response = await client.QuerySpans(request);

console.log(`Found ${response.spans.length} spans`);

// Query with JMESPath expression to filter traces
const queryRequest = trace.QuerySpansRequest.fromObject({
  query: "[?kind==`2`]", // All SERVER spans
  limit: 1000,
});
const queryResponse = await client.QuerySpans(queryRequest);

// Query by resource ID (returns complete traces)
const resourceRequest = trace.QuerySpansRequest.fromObject({
  resource_id: "common.Conversation.abc123",
  limit: 1000,
});
const resourceResponse = await client.QuerySpans(resourceRequest);

// Force flush buffered spans to disk
const flushRequest = trace.FlushTracesRequest.fromObject({});
await client.FlushTraces(flushRequest);
```

### Performance Characteristics

- **Overhead**: Minimal (<1% in typical workloads)
- **Buffering**: Spans batched before writing to disk
- **Async I/O**: Span recording does not block service operations
- **Error handling**: Tracing failures never break application flow
- **Storage**: ~1KB per span average, daily files typically 1-10MB

### Observability Best Practices

1. **Review traces regularly**: Check `data/traces/` daily for patterns
2. **Investigate errors**: Use trace IDs from logs to find full request context
3. **Monitor span counts**: High counts may indicate retry loops or recursion
4. **Track performance**: Analyze span durations for optimization opportunities
5. **Enrich spans**: Add domain attributes to make traces actionable
6. **Export strategically**: Consider OTLP export for production environments

## Supporting Components

Additional components that support development, deployment, and extension of the
platform.

### Code Generation

The platform uses centralized code generation to produce type-safe JavaScript
from Protocol Buffer schemas. The `@copilot-ld/libcodegen` package handles all
generation.

#### Generation Process

- **Setup**: Creates `generated/` directory with storage symlinks
- **Schema Discovery**: Scans `proto/` for core services and `tools/` for
  extensions
- **Type Generation**: Creates consolidated JavaScript types with JSDoc
- **Service Generation**: Produces base classes and typed clients
- **Definition Pre-compilation**: Generates runtime-ready gRPC service
  definitions
- **Package Integration**: Creates symlinks for access via `@copilot-ld/libtype`
  and `@copilot-ld/librpc`

#### Output Structure

The generated directory structure includes:

- `proto/`: Copied `.proto` files for runtime loading
- `types/types.js`: Consolidated protobuf types
- `services/exports.js`: Aggregated service/client exports
- `services/{name}/service.js`: Base class for each service
- `services/{name}/client.js`: Typed client for each service
- `definitions/`: Pre-compiled service definitions
- `bundle.tar.gz`: Compressed archive

Package symlinks are created at service startup to enable access via
`@copilot-ld/libtype` and `@copilot-ld/librpc`:

- `./packages/libtype/generated/` → `./generated/`
- `./packages/librpc/generated/` → `./generated/`

```
./generated/
├── proto/
├── types/
│   └── types.js
├── services/
│   ├── exports.js
│   ├── agent/
│   │   ├── service.js
│   │   └── client.js
│   └── definitions/
│       ├── agent.js
│       └── exports.js
└── bundle.tar.gz
```

#### Code Generation Commands

Generate everything (recommended):

```bash
npm run codegen
```

Generate specific components:

```bash
npm run codegen:type
npm run codegen:service
npm run codegen:client
npm run codegen:definition
```

These generate types only, service base classes, client classes, and service
definitions respectively.

#### Factory Function Pattern

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

#### Enhanced Content Representation

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

### Security Implementation

#### Authentication Mechanisms

##### Service Authentication

All inter-service communication uses HMAC-based authentication with time-limited
tokens:

- **Token Generation**: Service creates payload with ID and timestamp
- **Signing**: Payload signed with shared secret using HMAC
- **Transmission**: Token attached to gRPC metadata headers
- **Verification**: Receiving service validates signature and timestamp
- **Expiration**: Tokens expire after configured lifetime

##### Token Lifecycle

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

#### Communication Security

##### gRPC Internal Communication

- **Protocol**: gRPC with Protocol Buffers
- **Authentication**: HMAC signatures on every request
- **Token Lifetime**: Configurable short-lived duration
- **Secret Management**: Shared secret from environment
- **Schema Validation**: Automatic message validation

##### External API Communication

- **Client to Extensions**: HTTP/HTTPS via load balancer
- **LLM Service to APIs**: HTTPS with API key authentication

#### Threat Model

##### Protected Against

- **External Access**: Backend services isolated in Docker network
- **Service Impersonation**: HMAC prevents unauthorized access
- **Token Replay**: Time-limited tokens minimize replay windows
- **Request Forgery**: HMAC signatures prevent tampering

##### Known Limitations

- **Shared Secret Exposure**: Compromised secret bypasses authentication
- **Container Compromise**: Attacker gains access to shared secret
- **No mTLS**: gRPC communication not encrypted between services
- **No Rate Limiting**: Extensions must implement their own
- **Extension Security**: Primary attack surface requiring validation

#### Security Responsibilities by Layer

##### Extensions

- Input validation and sanitization
- Rate limiting and DDoS protection
- Session management
- CORS policy enforcement

##### Agent Service

- Request orchestration security
- Service-to-service authentication enforcement
- Business logic security validation

##### Backend Services

- gRPC message validation
- Resource usage limiting
- Data access controls
- Error handling without information disclosure

### Docker Build Process

#### Unified Dockerfile

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

#### Build Process

- **Base Stage**: Install Node.js and system dependencies
- **Dependencies**: Copy `package.json` and install packages with GitHub
  registry access
- **Source Copy**: Copy application code and generated artifacts
- **Runtime Configuration**: Configure service ports and entry points

#### Multi-Stage Benefits

- **Small Services**: The images contain only around 20 MB of application code
- **Fast Builds**: Cached layers minimize rebuild time
- **Consistency**: All services built identically
- **Security**: Minimal attack surface in production images

### Development Patterns

#### Service Adapter Pattern

Services are thin gRPC adapters around business logic packages. This separation
enables:

- **Unit Testing**: Test business logic without gRPC infrastructure
- **Reusability**: Same logic powers services and CLI tools
- **Framework Independence**: Business logic has no service dependencies

Example:

```javascript
/* eslint-env node */
import { AgentMind } from "@copilot-ld/libagent";
import { AgentBase } from "./service.js";

class AgentService extends AgentBase {
  #mind;

  constructor(config, mind) {
    super(config);
    this.#mind = mind;
  }

  async ProcessRequest(req) {
    return await this.#mind.processRequest(req);
  }
}
```

### Extension Development

#### Creating New Extensions

Extensions are application adapters that expose the platform through different
interfaces:

- **Create Directory**: `extensions/your-extension/`
- **Implement Interface**: REST API, Teams bot, Slack app, etc.
- **Use Agent Client**: Import `@copilot-ld/librpc` to call Agent service
- **Add to Docker**: Ensure unified Dockerfile supports your extension

#### Example Extension Structure

```
extensions/your-extension/
├── index.js           # Entry point
├── routes.js          # Request handlers
├── middleware.js      # Authentication, validation
├── package.json       # Extension-specific dependencies
└── CHANGELOG.md       # Component changelog
```

### Tool Development

#### Creating Custom Tools

Tools extend the platform with custom functionality accessible to the agent:

- **Define Protocol**: Create `tools/your-tool.proto`
- **Implement Service**: Create `tools/your-tool/index.js`
- **Configure Tool**: Add entry to `config/tools.yml`
- **Regenerate Code**: Run `npm run codegen`

#### Tool Configuration Example

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

### Testing Strategies

#### Unit Testing

Test business logic packages independently:

```javascript
/* eslint-env node */
import { describe, it } from "node:test";
import assert from "node:assert";
import { AgentMind } from "@copilot-ld/libagent";
import { createServiceConfig } from "@copilot-ld/libconfig";

describe("AgentMind", () => {
  it("assembles context correctly", async () => {
    const mockConfig = await createServiceConfig("agent");
    const mind = new AgentMind(mockConfig);
    const conversation = { id: "test-conversation", messages: [] };
    const context = await mind.assembleContext(conversation);
    assert.strictEqual(context.messages.length, 5);
  });
});
```

#### Integration Testing

Test service communication:

```javascript
/* eslint-env node */
import { describe, it } from "node:test";
import assert from "node:assert";
import { clients } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";

const { AgentClient } = clients;

describe("Agent Service", () => {
  it("processes requests end-to-end", async () => {
    const config = await createServiceConfig("agent");
    const client = new AgentClient(config);
    const response = await client.ProcessRequest({
      messages: [{ role: "user", content: "test" }],
    });
    assert.ok(response.choices);
  });
});
```

#### Performance Testing

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
