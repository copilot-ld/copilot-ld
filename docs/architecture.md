---
title: System Architecture
description: |
  Copilot-LD is built as a microservices platform using gRPC for inter-service
  communication, with framework-agnostic business logic packages and
  application-specific extensions. This architecture prioritizes modularity,
  maintainability, and performance.
toc: true
---

## High-Level Overview

The system is organized into three primary layers, each with distinct
responsibilities:

- **Extensions**: Application adapters that expose the platform through
  different interfaces (web UI, Teams bot, REST API)
- **Services**: Single-responsibility microservices communicating via gRPC with
  Protocol Buffers
- **Packages**: Reusable business logic libraries that services and extensions
  import

## Directory Structure

```text
copilot-ld/
├── services/            # gRPC microservices
│   ├── agent/           # Request orchestration
│   ├── memory/          # Conversation storage
│   ├── llm/             # Language model interface
│   ├── vector/          # Similarity search
│   ├── graph/           # Graph queries
│   └── tool/            # Tool execution proxy
├── extensions/          # Application adapters
│   ├── web/             # Web interface
│   └── teams/           # Teams bot (example)
├── packages/            # Business logic libraries
│   ├── libagent/        # Agent orchestration
│   ├── libmemory/       # Memory management
│   ├── libvector/       # Vector operations
│   ├── libgraph/        # Graph operations
│   ├── libresource/     # Resource management
│   ├── librpc/          # gRPC infrastructure
│   ├── libtype/         # Generated types
│   └── lib.../          # Additional utilities
├── proto/               # Protocol Buffer schemas
├── tools/               # Optional tool extensions
├── generated/           # Generated code artifacts
├── data/                # Runtime and processed data
└── scripts/             # Development utilities
```

## Component Relationships

### Communication Patterns

- **Client → Extension**: HTTP/HTTPS (REST endpoints)
- **Extension → Services**: gRPC with HMAC authentication
- **Service → Service**: gRPC with HMAC authentication
- **All Layers → Packages**: Direct imports (ES modules)

### Service Layer

Each service is a thin gRPC adapter around business logic packages. The Agent
service orchestrates requests by calling other services as needed:

- **Agent**: Orchestrates request processing and tool calling loops
- **Memory**: Manages conversation history with budget allocation
- **LLM**: Interfaces with language models for embeddings and completions
- **Vector**: Performs similarity search across dual indexes
- **Graph**: Executes pattern-based queries on RDF graphs
- **Tool**: Proxies tool calls from agent to implementations

For detailed service implementations, see the [Reference Guide](/reference/).

### Package Layer

Business logic packages (`@copilot-ld/lib*`) contain framework-agnostic code
that services import. This separation enables:

- **Testability**: Unit test logic without service infrastructure
- **Reusability**: Same code powers services and CLI tools
- **Maintainability**: Clear separation between communication and computation

For complete package catalog, see the [Reference Guide](/reference/).

### Extension Layer

Extensions are application-specific adapters that call the Agent service via
gRPC. They handle:

- **Protocol Translation**: Convert HTTP/WebSocket/Bot protocols to gRPC
- **Authentication**: Validate user credentials and manage sessions
- **Input Validation**: Sanitize and validate user input
- **Rate Limiting**: Protect backend from abuse

## Online Request Flow

The following sequence diagram shows how a user request flows through the system
at runtime. The Agent makes autonomous decisions about which services to call
and when:

```mermaid
sequenceDiagram
    participant Client
    participant Extension as Extensions
    participant Agent as Agent service
    participant Memory as Memory service
    participant LLM as LLM service
    participant Tool as Tool service
    participant Vector as Vector service
    participant ContentIndex as Content Vector Index
    participant ResourceIndex as Resource Index
    participant GitHub as GitHub API

    Client->>Extension: REST request
    Extension->>Agent: RPC request (ProcessRequest)

    Note right of Agent: GitHub validation
    Agent->>GitHub: GET /user (validate token)
    GitHub-->>Agent: 200 OK (user)

    Agent->>ResourceIndex: Get/Create conversation
    Agent->>ResourceIndex: Put user message (scoped to conversation)
    Agent->>ResourceIndex: Get assistant by id (from config)
    Note right of Agent: Compute token budget (budget = config.budget.tokens - assistant.content.tokens) and derive allocation

    Agent->>Memory: Get (for conversation, with budget/allocation)
    Memory-->>Agent: Window (tools, history)

    Agent->>ResourceIndex: Resolve window identifiers (tools/history)
    ResourceIndex-->>Agent: Resources (policy-filtered)

    Note over Agent: Autonomous Tool Calling Loop (max 10 iterations)
    loop Until no tool calls or max iterations
        Agent->>LLM: CreateCompletions (assistant + tasks + tools + history)
        LLM-->>Agent: Completion with autonomous tool call decisions

        alt Tool calls present
            loop For each autonomous tool call
                Agent->>Tool: Call (tool call + github_token)
                Tool-->>Agent: Tool result message
                Note right of Agent: Add tool result to messages
            end
            Note right of Agent: Continue loop with updated messages
        else No tool calls
            Note right of Agent: Exit loop - completion ready
        end
    end

    Agent->>ResourceIndex: Put final completion message (scoped to conversation)

    Agent-->>Extension: RPC response (with conversation_id)
    Extension-->>Client: REST response
```

### Key Characteristics

- **Sequential per request**: Each request is processed step-by-step
- **Concurrent requests**: Multiple requests can be handled in parallel
- **Autonomous decisions**: Agent decides which tools to call dynamically
- **Policy filtering**: All resource access respects access policies
- **Budget management**: Token budgets allocated across context components

## Offline Processing Flow

Before the system can answer questions, knowledge must be processed into
searchable formats. This happens offline during the build process:

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Scripts as Processing Scripts
    participant HTML as HTML Files
    participant ResourceProc as Resource Processor
    participant ResourceIndex as Resource Index
    participant LLM as LLM API
    participant VectorProc as Vector Processor
    participant VectorIndex as Vector Indexes

    Note over Dev,VectorIndex: Offline Processing Pipeline

    Dev->>Scripts: npm run process

    Note over Scripts: 1. Assistant Processing
    Scripts->>ResourceIndex: Load assistants from config/assistants.yml
    ResourceIndex-->>Scripts: Assistants stored

    Note over Scripts: 2. Resource Processing
    Scripts->>HTML: Read knowledge files
    HTML-->>ResourceProc: HTML with microdata

    loop For each microdata item
        ResourceProc->>ResourceProc: Extract content & metadata
        ResourceProc->>ResourceIndex: Store resource with URI identifier
    end

    Note over Scripts: 3. Descriptor Generation
    loop For each resource
        Scripts->>LLM: Generate descriptor (batched)
        LLM-->>Scripts: Descriptor text
        Scripts->>ResourceIndex: Update resource with descriptor
    end

    Note over Scripts: 4. Vector Processing
    Scripts->>ResourceIndex: Load all resources

    loop Batch processing
        ResourceProc->>LLM: Create embeddings (content + descriptors, batched)
        LLM-->>VectorProc: Vector embeddings
        VectorProc->>VectorIndex: Add to content index
        VectorProc->>VectorIndex: Add to descriptor index
    end

    VectorIndex-->>Scripts: Indexes persisted to disk
    Scripts-->>Dev: Processing complete
```

### Processing Stages

1. **Assistant Configuration**: Load assistant definitions from YAML
2. **Resource Extraction**: Parse HTML microdata into individual resources
3. **Descriptor Generation**: Generate AI descriptions of resource purpose
4. **Embedding Creation**: Convert content and descriptors to vectors
5. **Index Building**: Create dual indexes for similarity search

For detailed processing workflows, see the [Processing Guide](/processing/).

## Code Generation Workflow

Protocol Buffer schemas in `proto/` and `tools/` are compiled into JavaScript
types and service infrastructure:

```
Developer defines schema → npm run codegen → Generated artifacts
                                              ↓
proto/agent.proto ──────────────────→ generated/types/types.js
proto/memory.proto                     generated/services/agent/service.js
tools/hash.proto                       generated/services/agent/client.js
                                       generated/proto/ (copied schemas)
```

Services automatically create symlinks at startup so packages can access
generated code via `@copilot-ld/libtype` and `@copilot-ld/librpc`.

For code generation details, see the [Reference Guide](/reference/).

## Deployment Architecture

The system can be deployed in multiple configurations depending on your needs:

### Local Development

```bash
# All services run on localhost with individual ports
npm run dev

# Services available at:
# - Web Extension: http://localhost:3000/web
# - Agent: localhost:3001 (gRPC, internal)
# - Memory: localhost:3002 (gRPC, internal)
# - LLM: localhost:3003 (gRPC, internal)
# - Vector: localhost:3004 (gRPC, internal)
# - Graph: localhost:3005 (gRPC, internal)
# - Tool: localhost:3006 (gRPC, internal)
```

### Docker Compose

```bash
# Services run in Docker network with internal communication
docker-compose up

# Only web extension exposed externally
# Backend services isolated in Docker network
```

### Production (AWS/Cloud)

- **Load Balancer**: Application Load Balancer routes to extensions
- **Container Orchestration**: ECS/Kubernetes manages services
- **Network Isolation**: Backend services in private VPC
- **Service Discovery**: DNS-based service resolution

For deployment instructions, see the [Deployment Guide](/deployment/).

## Security Architecture

Security is built into every layer of the architecture:

### Network Isolation

- **External Access**: Only extensions exposed via load balancer
- **Internal Services**: Backend services not accessible from outside
- **gRPC Communication**: All inter-service calls require HMAC authentication

### Authentication

- **Service-to-Service**: HMAC signatures with time-limited tokens
- **GitHub Integration**: OAuth device flow for user authentication
- **API Keys**: LLM service uses API keys for external calls

### Access Control

- **Policy-Based**: All resource access filtered by policies
- **Conversation Scoping**: Users only access their own conversations
- **Tool Restrictions**: Tools can be restricted by configuration

For security implementation details, see the [Reference Guide](/reference/).

## Next Steps

Now that you understand the architecture, explore:

- [Concepts](/concepts/) – Learn about linked data, RAG, and the foundational
  concepts behind architectural decisions
- [Reference](/reference/) – Dive into service implementations, package APIs,
  code generation, and security details
