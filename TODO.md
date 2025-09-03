# TODO

**Goal:** Enable multiple agents, coordinated by a planner, with nested tasks
and policies for robust workflow controls.

## Implementation Roadmap

### Phase 1: Foundation (Steps 1-4)

- [x] **Step 01**: Deprecate History, Agent, Text services
- [x] **Step 02**: Remove `libchunk`, `libprompt`
- [x] **Step 03**: Deprecate some protobuf types
- [x] **Step 04**: Enhancing `libstorage`

### Phase 2: Core Resources (Steps 5-7)

- [x] **Step 05**: New `libpolicy`
- [x] **Step 06**: New `Resource` type and `libresource`
- [x] **Step 07**: Use `Resource` type and `libresource`

### Phase 3: Services & Integration (Steps 8-9+)

- [x] **Step 08**: New Memory service
- [x] **Step 09**: Rename tools to scripts
- [ ] **Step 10**: New Tool service
- [ ] **Step 11**: New Event service
- [ ] **Step 12**: New Plan service
- [ ] **Step 13**: New Assistant service
- [ ] **Step 14**: Update extensions to use Plan service
- [ ] **Step 15**: Remove deprecated items and rename `MessageV2` to `Message`
- [ ] **Step 16**: New Graph tool

**🚨 CRITICAL**: Each step must be completed and tested before proceeding to the
next step. Dependencies between steps are strict and must be respected.

## Summary

The architecture is shifting towards a more flexible concept around generic
resources. Anything that an agent needs to achieve its goal is considered a
resource. For example: conversations, messages, tasks, and text chunks. Even
other agents are considered resources!

Tasks are broken down into infinitely nested subtasks for flexible workflow
execution. Tasks are executed recursively with Assistants assigned based on
similarity between their capabilities and task requirements.

Access to resources is managed by policies that are defined in `.rego` files and
evaluated using the `@openpolicyagent/opa-wasm` library.

### Resources vs. Linked Data

There will be a distinction between _Resources_ and _Linked Data_.

**Linked Data** describes the relationships between pieces of information
contained inside text chunks. **Resources** are the text chunks themselves, _not
the data inside them_.

Resources are managed by the `Resource` service, backed by a simple undirected
tree. Resources are critical to the functioning of the system itself.

Linked Data and the `Graph` service are not critical to the system's core
functionality. They only support Tools that improve the accuracy of the agents.

The `Graph` service is backed by an in-memory RDF graph using the `n3` package.
That is, the `Graph` service manages Linked Data in a directed graph.

### Resources and Policies

Resources are identified by a simple Universal Resource Identifier (URI)
formatted as `uri_namespace:path` where:

- `uri_namespace` is the URI assignment and always set to "cld"
- `path` is parents' path plus the resource's own path element, joined by "/"
- Each path element consist of a resource type and ID joined by "."

Resources are stored using their URI as the object name. Here are examples
looking at the raw local file system:

```bash
developer@localhost$ ls -1 resources/
cld:common.Conversation.hash0001.json
cld:common.Conversation.hash0001/common.MessageV2.hash0002.json
cld:common.Conversation.hash0001/common.MessageV2.hash0002/plan.Task.hash0003.json
cld:common.Conversation.hash0001/common.MessageV2.hash0002/plan.Task.hash0003/plan.Task.hash0004.json
```

It is now fast and efficient for the Resource service to fetch all tasks within
a conversation or all subtasks within a task by searching for objects with the
appropriate URI prefix.

### Current State

**The current architecture** is documented in
[docs/architecture.html](docs/architecture.html).

### Future State

#### Simple Summary

1. **Users**
   1. Start a Conversation by sending a Message to Extensions
2. **Extensions**
   1. Receive user Message
   1. Call Plan service to handle the Message
3. **Plan service**
   1. Creates one or more nested Tasks using a single Tool call
   2. Each Task is assigned an Assistant based on similarity search
4. **Assistant service**
   1. For Tasks with subtasks: subscribes to Events and monitors completion
   2. For Tasks without subtasks: executes the Inner Loop directly
   3. Evaluates task completion and creates corrective subtasks if needed
5. **Plan service**
   1. Responds to Extensions when all Tasks complete
6. **Extensions**
   1. Respond to User
7. **Users**
   1. Receive the response

#### Task System Architecture

**Task Creation and Nesting**

Tasks are created by the Plan service through a single Tool call with a
recursive JSON payload. Tasks can be infinitely nested, forming a tree structure
where each subtask can have its own subtasks.

**Resource Metadata Enhancement**

All resources (Tasks, Assistants, etc.) have enhanced metadata under their
"Resource meta" data with four key properties:

1. **purpose** - What the resource is meant to accomplish
2. **instructions** - How to execute or work with the resource
3. **applicability** - When or when not to use the resource
4. **evaluation** - What successful execution looks like

These four properties are compiled into a single structured "description" of the
resource, which is used for vector embedding and similarity searches.

**Assistant Assignment**

For each Task recursively, an Assistant is elected through similarity search
between the Assistant's description and the Task's description (both compiled
from the four metadata properties above).

**Task Execution Patterns**

Tasks are executed in one of two modes:

- **Supervisory Mode** (Tasks with subtasks): Assistant subscribes to Events and
  monitors subtask completion
- **Direct Mode** (Tasks without subtasks): Assistant executes the Inner Loop
  directly

#### Task Execution: Supervisory Mode

When a Task has subtasks, the assigned Assistant operates in supervisory mode:

1. Subscribes to completion events for all subtasks
2. Monitors subtask completion and evaluates against `Task.meta.evaluation`
3. Creates corrective subtasks if the overall task was unsuccessful

#### Task Execution: Direct Mode

When a Task has no subtasks, the assigned Assistant executes directly:

1. Fetches related resources and performs similarity search for context
2. Executes "The Inner Loop" (defined below)
3. Persists a `MessageV2` resource with the task output

#### The Inner Loop

The Inner Loop remains unchanged from the previous architecture and consists of
iterative prompt completion with tool execution until no more tools are
requested.

The URI structure enables easy fetching of all parent resources. For example, a
sub Task URI like
`cld:common.Conversation.hash0001/common.MessageV2.hash0002/plan.Task.hash0003/plan.Task.hash0004`
allows the Assistant to fetch the Conversation, Message, and parent Task
contexts.

#### Detailed Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Extension as Extension Layer
    participant Plan as Plan Service
    participant Asst as Assistant Service
    participant Resource as Resource Index
    participant Vector as Vector Service
    participant Tools as Tool Service
    participant Event as Event Service
    participant LLM as LLM Service

    %% Step 1: Users start conversation
    User->>Extension: Start Conversation by sending Message

    %% Step 2: Extensions receive and forward
    Note over Extension: Receive user Message
    Extension->>Plan: Call Plan service to handle Message

    %% Step 3: Plan service creates nested Tasks
    Note over Plan: Creates nested Tasks via single Tool call<br/>with recursive JSON payload
    Plan->>Resource: Persist Task tree structure

    %% Step 4: Assign Assistants to Tasks
    loop For each Task in tree (recursive)
        Note over Plan: Similarity search between Task description<br/>and Assistant descriptions
        Plan->>Vector: Search for best Assistant match
        Vector-->>Plan: Return best Assistant
        Plan->>Asst: Assign Assistant to Task
    end

    %% Step 5: Task Execution
    par Execute Tasks in parallel
        loop For each assigned Task
            alt Task has subtasks (Supervisory Mode)
                Note over Asst: Subscribe to subtask completion events
                Asst->>Event: Subscribe to RESOURCE_PUT events<br/>with Task URI prefix filter

                loop Monitor subtasks
                    Event-->>Asst: Subtask completion event
                    Note over Asst: Check if all subtasks complete
                end

                Note over Asst: All subtasks complete
                Asst->>Resource: Get all subtask outputs
                Resource-->>Asst: Return subtask results

                Note over Asst: Evaluate against Task.meta.evaluation
                Asst->>LLM: Assess task completion success
                LLM-->>Asst: Return evaluation result

                alt Task unsuccessful
                    Note over Asst: Create corrective subtasks
                    Asst->>Resource: Persist new corrective subtasks
                    Asst->>Plan: Request Assistant assignment for new subtasks
                else Task successful
                    Note over Asst: Task complete
                    Asst->>Resource: Persist final MessageV2 output
                end

            else Task has no subtasks (Direct Mode)
                %% Fetch task context
                Note over Asst: Fetch resources from Task URI path
                Asst->>Resource: Get parent resources<br/>(Conversation, Message, etc.)
                Resource-->>Asst: Return context resources

                %% Similarity search for additional context
                Note over Asst: Perform similarity search for relevant resources
                Asst->>Vector: Search for similar resources
                Vector-->>Asst: Return similar resources

                %% The Inner Loop
                Note over Asst: Execute "The Inner Loop"
                loop Until no tool calls requested
                    Note over Asst: Complete prompt with resources and tools
                    Asst->>LLM: Complete prompt
                    LLM-->>Asst: Return completion

                    alt Tool calls requested
                        Note over Asst: Execute tool calls
                        Asst->>Tools: Execute tools
                        Tools-->>Asst: Return tool results
                    else No tools requested
                        Note over Asst: End Inner Loop
                    end
                end

                Note over Asst: Persist task output
                Asst->>Resource: Persist MessageV2 with results
            end
        end
    end

    %% Step 6: Plan service responds when all complete
    Note over Plan: All root Tasks complete
    Plan-->>Extension: Return aggregated response

    %% Step 7: Extensions respond to User
    Note over Extension: Process and format response
    Extension-->>User: Deliver final response
    Note over User: Receive response
```

## Implementation Plan

### Step 10: New Tool Service

**🎯 Objective**: Create an extensible `Tool` service that acts as a gRPC proxy
between tool calls requested by `LLMs` and actual tool implementations, with
automatic tool discovery and registration from `./tools/*.proto` files.

**🔧 Implementation Details:**

1. **Tool Discovery**: Tools are defined as `.proto` files in `./tools/`
   directory with `package toolbox;` namespace
2. **Proxy Architecture**: Tool service routes tool calls to appropriate gRPC
   endpoints based on service mappings in configuration
3. **Auto-Registration**: `scripts/codegen.js` discovers tools and generates
   `OpenAI`-compatible JSON schemas stored as resources
4. **Dynamic Routing**: Tool service uses `hostname`/port mappings from
   `ServiceConfig` to route calls to tool implementations
5. **Extensible Design**: New tools can be added without modifying core services
   by adding `.proto` files and updating configuration

**📋 Detailed Tasks**:

#### Task 1: Create Tool Discovery Infrastructure

- [ ] Create `tools/` directory structure in project root
- [ ] Create sample tool proto `tools/vector_search.proto`:

  ```proto
  syntax = "proto3";

  package toolbox;

  service VectorSearch {
    rpc SearchSimilar(SearchRequest) returns (SearchResponse);
  }

  message SearchRequest {
    string query = 1;
    optional int32 limit = 2;
    optional double threshold = 3;
  }

  message SearchResponse {
    repeated SearchResult results = 1;
  }

  message SearchResult {
    string id = 1;
    double score = 2;
    string content = 3;
  }
  ```

- [ ] Update `.gitignore` if needed to track `tools/` directory
- [ ] Create `tools/README.md` with tool development guidelines

#### Task 2: Extend Code Generation for Tool Discovery

- [ ] Modify `scripts/codegen.js` to add `--tools` flag:
  - Add new `runToolDiscovery()` function
  - Scan `./tools/*.proto` files for `package toolbox;` definitions
  - Generate `OpenAI`-compatible JSON schemas from protobuf definitions
  - Output schemas to intermediate files for offline processing
- [ ] Add tool schema generation logic:
  - Parse protobuf field definitions to `OpenAI` function schemas
  - Map protobuf types to JSON schema types (string, number, boolean, etc.)
  - Generate required/optional field arrays from protobuf field rules
  - Create tool descriptions from protobuf comments
- [ ] Add `--tools` to `--all` flag processing
- [ ] Test tool discovery with sample `vector_search.proto`

#### Task 3: Define Tool Service Protocol

- [ ] Create `proto/tool.proto` with proxy service definition:

  ```proto
  syntax = "proto3";

  import "common.proto";

  package tool;

  service Tool {
    rpc ExecuteTool(common.Tool) returns (common.ToolCallResult);
    rpc ListTools(ListToolsRequest) returns (ListToolsResponse);
  }

  message ListToolsRequest {
    optional string namespace = 1;
  }

  message ListToolsResponse {
    repeated common.Tool tools = 1;
  }
  ```

- [ ] Run `npm run codegen` to generate service base and client
- [ ] Verify generated files in `services/tool/` directory

#### Task 4: Implement Tool Service Foundation

- [ ] Create `services/tool/` directory structure:
  - `services/tool/index.js` - Main `ToolService` implementation
  - `services/tool/package.json` - Service dependencies
  - `services/tool/Dockerfile` - Container definition
  - `services/tool/CHANGELOG.md` - Component changelog
- [ ] Implement `ToolService` extending `ToolBase`:
  - Constructor accepts `ServiceConfig` following established patterns
  - Access tool endpoint mappings via `this.config.endpoints` from loaded config
  - Load available tools from `ResourceIndex` during initialization
  - Create gRPC client connections to tool services based on config mapping
  - Implement policy integration for tool access control

#### Task 5: Implement Proxy Logic

- [ ] Implement `ExecuteTool` method in `ToolService`:
  - Parse tool function name to determine target service
  - Look up service endpoint from configuration mapping
  - Convert `common.Tool` request to appropriate protobuf message
  - Create gRPC client connection to target service
  - Forward request and convert response back to `common.ToolCallResult`
  - Add comprehensive error handling and logging
- [ ] Implement `ListTools` method:
  - Query `ResourceIndex` for available tool schemas
  - Return formatted tool definitions for LLM consumption
  - Support namespace filtering for tool organization
- [ ] Add connection pooling for tool service gRPC clients

#### Task 6: Tool Configuration and Mapping

- [ ] Define tool service configuration in `config/config.example.yml`:
  ```yaml
  service:
    tool:
      endpoints:
        vector_search:
          host: "vector"
          port: 50051
          service: "toolbox.VectorSearch"
        # Additional tool endpoints...
  ```
- [ ] Tool service accesses endpoint mappings via `this.config.endpoints`
- [ ] Create validation for tool configuration completeness in tool service
- [ ] Environment variable overrides work through existing `ServiceConfig`
      patterns

#### Task 7: Create Tool Schema Resource Generator

- [ ] Create `scripts/tools.js` following the pattern of `scripts/resources.js`:
  - Accept command line arguments for tool discovery options
  - Use `ScriptConfig.create("tools")` for configuration
  - Initialize `ResourceIndex`, storage factories, and logging
  - Process tool schemas generated by `scripts/codegen.js --tools`
- [ ] Implement tool schema resource creation:
  - Read `OpenAI`-compatible schemas from `codegen` output
  - Generate resource files in appropriate resource directory
  - Use proper resource URIs for tool schema identification
  - Include tool metadata (description, parameters, examples)
- [ ] Add resource querying support for dynamic tool discovery in `ToolService`

#### Task 8: Sample Tool Implementation

- [ ] Create sample vector search tool service:
  - `tools/vector_search/index.js` - Tool implementation
  - `tools/vector_search/Dockerfile` - Container definition
  - `tools/vector_search/package.json` - Dependencies
- [ ] Implement `toolbox.VectorSearch` service:
  - Accept `SearchRequest` and return `SearchResponse`
  - Integrate with existing `VectorClient` for actual search
  - Follow established service patterns with proper logging
- [ ] Add tool service to Docker configuration for testing

#### Task 9: Docker and Development Integration

- [ ] Add `tool` service to `docker-compose.yml`:
  ```yaml
  tool:
    build:
      context: .
      dockerfile: ./services/tool/Dockerfile
    image: copilot-ld/tool:latest
    container_name: copilot-ld.tool
    env_file: ./config/.env
    networks:
      - internal
  ```
- [ ] Add sample tool services to Docker configuration
- [ ] Update `scripts/dev.js` to include tool services
- [ ] Verify service startup and tool discovery functionality

#### Task 10: Agent Integration

- [ ] Add `ToolClient` dependency to `AgentService`:
  - Update constructor with proper dependency injection
  - Add tool client validation and initialization
  - Update `services/agent/server.js` to create `ToolClient` instance
- [ ] Implement tool call execution in `AgentService.ProcessRequest`:
  - Detect tool calls in LLM responses
  - Execute tools via `ToolClient.ExecuteTool` calls
  - Handle tool results and format for LLM continuation
  - Add error handling for tool execution failures
- [ ] Implement basic Inner Loop with tool calling support

#### Task 11: Testing and Validation

- [ ] Create comprehensive test suite `test/tool-service.test.js`:
  - Test tool discovery and schema generation
  - Test tool proxy execution with sample vector search
  - Test error handling for missing tools and invalid requests
  - Test policy enforcement and access control
- [ ] Create integration tests for end-to-end tool calling
- [ ] Test tool configuration loading and endpoint mapping
- [ ] Validate tool schema generation accuracy

#### Task 12: Documentation Updates

- [ ] Update `services/tool/CHANGELOG.md` with implementation details
- [ ] Add tool service to `docs/architecture.html`:
  ```html
  <h4>Tool Service</h4>
  <p>
    <strong>Purpose</strong>: Acts as a gRPC proxy between LLM tool calls and
    actual tool implementations, with automatic discovery from tools/*.proto
  </p>
  <p><strong>Key Operations</strong>:</p>
  <ul>
    <li>
      <code>ExecuteTool</code>: Proxies tool calls to appropriate services
    </li>
    <li><code>ListTools</code>: Returns available tools for LLM consumption</li>
  </ul>
  ```
- [ ] Create `tools/README.md` with tool development guidelines
- [ ] Update main `README.md` with tool development workflow

**✅ Success Criteria**:

1. **Tool Discovery**: Automatic discovery of tools from `./tools/*.proto` files
2. **Schema Generation**: `OpenAI`-compatible schemas generated and stored as
   resources
3. **Proxy Functionality**: Tool service successfully routes calls to target
   services
4. **Configuration**: Tool endpoints configurable via service configuration
5. **Extensibility**: New tools can be added without modifying core services
6. **Agent Integration**: Agent service can discover and execute tools via proxy
7. **Testing**: Comprehensive test coverage for tool discovery and execution

**🔗 Dependencies**:

- Current protobuf types in `common.proto` (already contain `Tool` and
  `ToolCallResult`)
- Existing `@copilot-ld/libpolicy` for access control
- Existing `ResourceIndex` for tool schema storage
- Existing service patterns and Docker infrastructure
- Modified `scripts/codegen.js` for tool discovery

**🚧 Implementation Notes**:

- Tool service acts as a pure proxy - no business logic, just routing
- Tools are separate gRPC services that can be developed independently
- Configuration-driven endpoint mapping allows flexible deployment
- Resource-based tool schemas enable dynamic tool discovery
- Follows existing architectural patterns for consistency
- Extensible design supports future tool ecosystem growth

## Step 11: New Event service

**🎯 Objective**: TODO

**📋 Tasks**:

TODO

**🔧 Implementation Details**:

The `event.proto` definitions are added:

```proto
syntax = "proto3";

import "common.proto";

package event;

service Event {
  rpc Publish(Event) returns (PublishResponse);
  rpc Subscribe(SubscribeRequest) returns (stream Event);
}

enum DetailType {
  RESOURCE_PUT = 0;
  RESOURCE_GET = 1;
  RESOURCE_DELETE = 2;
}

message Event {
  string id = 1; // UUID
  string source = 2;
  string time = 3; // ISO 8601
  repeated Resource resources = 4;
  DetailType detail_type = 5;
}

message PublishResponse {
  bool success = 1;
  string id = 2;
}

message SubscribeRequest {
  repeated string sources = 1;
  repeated string detail_types = 2;
}
```

**✅ Success Criteria**:

TODO

### Steps 12-16: Other Service Implementations & Integrations

**🎯 Objective**: Implement other new services and complete the architectural
transition.

**📋 Tasks**:

- **Step 11**: New Plan service
- **Step 12**: New Assistant service
- **Step 13**: Update extensions to use Plan service
- **Step 14**: Remove deprecated items and rename `MessageV2` to `Message`
- **Step 15**: New Graph tool

**⚠️ Implementation Notes**:

- Each step builds on previous completed steps
- Services must follow established gRPC patterns from existing codebase
- All new services require comprehensive unit and integration tests
- Performance benchmarks must be established for each service
- Documentation must be updated incrementally with each service addition

**🔧 Implementation Details**:

The `plan.proto` definitions are added:

```proto
syntax = "proto3";

import "common.proto";

package plan;

service Plan {
  rpc Process(common.MessageV2) returns (stream common.MessageV2);
}

message Task {
  common.Resource meta = 1;
  repeated Task subtasks = 2;
  optional string assistant = 3; // Resource ID of assigned Assistant
  optional bool completed = 4;
  optional string completed_at = 5; // ISO 8601
}
```

**✅ Success Criteria for Each Step**:

- Service implements all protobuf-defined methods
- gRPC integration works with existing infrastructure
- Unit tests achieve >90% coverage
- Integration tests validate end-to-end functionality
- Performance meets or exceeds current system benchmarks
- Documentation reflects new capabilities
