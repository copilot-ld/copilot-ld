---
title: Core Concepts
description: |
  Understanding the foundational concepts behind Copilot-LD helps you make the
  most of the platform. This guide explains the "why" behind key architectural
  decisions and how they work together.
toc: true
---

## What is Copilot-LD?

Copilot-LD is an intelligent agent that combines GitHub Copilot's language
models with linked data and retrieval-augmented generation (RAG) to provide
accurate, context-aware assistance. Unlike simple chatbots, it understands
semantic relationships in your knowledge base and provides responses grounded in
your actual data.

## Core Technologies

### Linked Data

Linked data provides the semantic structure that makes Copilot-LD uniquely
accurate. Instead of treating content as plain text, the system understands
relationships and context through HTML microdata with Schema.org vocabularies.

**Why Linked Data?**

- **Semantic Understanding**: Preserves meaning and relationships between
  concepts
- **Accurate Chunking**: Content boundaries align with semantic units, not
  arbitrary character limits
- **Rich Metadata**: Every piece of content includes structured information
  about its type and purpose
- **Standard Vocabularies**: Schema.org provides well-defined, interoperable
  types

### Retrieval-Augmented Generation (RAG)

RAG enhances language model responses by retrieving relevant context from your
knowledge base before generating answers. This grounds responses in factual
information rather than relying solely on the model's training data.

**The RAG Process**:

1. **Query**: User asks a question or makes a request
2. **Retrieve**: System finds relevant content using vector similarity search
3. **Augment**: Retrieved content is added to the conversation context
4. **Generate**: Language model produces a response informed by the retrieved
   context

**Why RAG?**

- **Accuracy**: Responses based on your actual knowledge base, not generic
  training data
- **Up-to-date**: Information reflects current content without retraining models
- **Transparency**: Can trace responses back to source documents
- **Control**: You determine what information is available to the system

### Microservices Architecture

Copilot-LD is built as a collection of specialized microservices that
communicate via gRPC. Each service has a single, well-defined responsibility.

**Why Microservices?**

- **Modularity**: Services can be developed, tested, and deployed independently
- **Scalability**: Scale individual services based on their specific resource
  needs
- **Maintainability**: Smaller, focused codebases are easier to understand and
  modify
- **Technology Independence**: Services can use different technologies if needed
- **Fault Isolation**: Problems in one service don't cascade to others

### gRPC Communication

Services communicate using gRPC, a high-performance RPC framework with Protocol
Buffers for message serialization.

**Why gRPC?**

- **Type Safety**: Protocol Buffers provide strong typing and schema validation
- **Performance**: Binary serialization is faster and more compact than JSON
- **Code Generation**: Automatically generate client and server code from
  schemas
- **Cross-Platform**: Works across different languages and platforms
- **Built-in Features**: Authentication, timeouts, and error handling included

## System Capabilities

### Intelligent Request Processing

The Agent service orchestrates request processing, making autonomous decisions
about which tools to call and when. It doesn't follow a rigid workflow but
adapts based on the conversation context and available tools.

### Contextual Memory

The Memory service maintains conversation history with intelligent budgeting. It
allocates token budgets between tools, context, and history to maximize
relevance while respecting model limits.

### Semantic Search

The Vector service provides dual-index search capabilities:

- **Content Search**: Find documents by their actual content
- **Descriptor Search**: Find documents by their purpose and applicability

This dual approach enables both "what does it say?" and "what is it for?"
queries.

### Policy-Based Access Control

The Graph service enforces policy-based filtering, ensuring users only access
resources they're authorized to see. Policies are defined declaratively and
applied consistently across all resource access.

### Extensible Tool System

The Tool service enables the agent to execute external functions. Tools are
defined using Protocol Buffers and can be added without modifying core services.
The agent autonomously decides when to call tools based on conversation context.

## Request Flow

Understanding how a request flows through the system helps clarify how the
components work together.

### Online Processing (Runtime)

1. **Client Request**: User sends a message through an extension (web interface,
   Teams bot, etc.)
2. **Agent Orchestration**: Agent service receives the request and validates
   authentication
3. **Memory Assembly**: Agent requests a memory window with conversation history
   and available tools
4. **Context Retrieval**: Agent resolves resource identifiers to actual content,
   with policy filtering applied
5. **Completion Generation**: Agent sends assembled context to LLM service for
   response generation
6. **Tool Execution**: If the LLM decides to call tools, Agent executes them and
   continues the loop
7. **Response**: Final completion is saved to memory and returned to the client

This flow is **sequential per request** but multiple requests can be processed
concurrently. The agent makes intelligent decisions at each step rather than
following a rigid pipeline.

### Offline Processing (Build Time)

Before the system can answer questions, knowledge must be processed into
searchable formats:

1. **Resource Extraction**: HTML files with microdata are scanned and converted
   to individual resource documents
2. **Descriptor Generation**: LLM generates descriptions of each resource's
   purpose and applicability
3. **Embedding Creation**: Both content and descriptors are converted to vector
   embeddings
4. **Index Building**: Vector databases are created for fast similarity search

This offline pipeline ensures runtime queries are fast—no external API calls
needed during search, just in-memory vector operations.

## Why Separate Online and Offline Processing?

Copilot-LD deliberately separates build-time processing from runtime operations
for several important reasons:

### Performance

- **No API Delays**: Runtime searches use pre-computed embeddings, eliminating
  LLM API latency
- **In-Memory Operations**: Vector similarity is computed locally without
  network calls
- **Predictable Latency**: Response times are consistent and fast

### Cost Efficiency

- **One-Time Embeddings**: Generate embeddings once during processing, not on
  every query
- **Batch Processing**: Offline pipeline optimizes API calls through batching
- **No Per-Query Costs**: Vector search has zero API cost

### Reliability

- **Offline Validation**: Catch processing errors before deployment
- **Reduced Dependencies**: Runtime doesn't depend on external embedding APIs
- **Reproducible Builds**: Same input always produces same indexes

## Architectural Principles

### Radical Simplicity

Copilot-LD is built with plain JavaScript and no external dependencies beyond
Node.js built-ins. This deliberate choice makes the system:

- **Easy to Understand**: No framework magic or hidden complexity
- **Easy to Deploy**: Minimal container size (under 10 MB)
- **Easy to Maintain**: No dependency updates or compatibility issues
- **Easy to Audit**: Small codebase with explicit behavior

### Business Logic First

Core logic lives in framework-agnostic packages (`@copilot-ld/lib*`) that can be
imported and tested independently. Services are thin adapters that wire packages
together with gRPC communication.

**Benefits**:

- **Testability**: Business logic can be unit tested without service
  infrastructure
- **Reusability**: Same logic can power different interfaces (CLI tools,
  services, extensions)
- **Clarity**: Separation between communication (gRPC) and computation (business
  logic)

### Type Safety Without TypeScript

Protocol Buffers provide type safety and schema validation without requiring
TypeScript compilation. Generated JavaScript includes JSDoc types for IDE
support while remaining simple JavaScript at runtime.

### Security by Design

Security is built into the architecture from the start:

- **Network Isolation**: Backend services are not exposed externally
- **Authenticated Communication**: HMAC authentication for all inter-service
  calls
- **Time-Limited Tokens**: Short-lived authentication tokens prevent replay
  attacks
- **Policy Enforcement**: Access control applied at the data layer
- **Minimal Attack Surface**: Small container images with only essential
  components

## Next Steps

Now that you understand the core concepts, you can:

- [Architecture](/architecture/) – See how these concepts map to actual system
  components
- [Reference](/reference/) – Deep dive into implementation details
