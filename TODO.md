# TODO

**Goal:** Enable multiple agents, coordinated by a planner, with nested tasks
and policies for robust workflow controls.

## Implementation Roadmap

### Phase 1: Foundation (Steps 1-4)

- [x] **Step 01**: Deprecate History, Agent, Text services
- [x] **Step 02**: Deprecate `libchunk`, `libprompt`
- [x] **Step 03**: Deprecate some protobuf types
- [x] **Step 04**: Enhancing `libstorage`

### Phase 2: Core Resources (Steps 5-7)

- [x] **Step 05**: New `libpolicy`
- [x] **Step 06**: New `Resource` type and `libresource`
- [ ] **Step 07**: Use `Resource` type and `libresource`

### Phase 3: Services & Integration (Steps 8-9+)

- [ ] **Step 08**: Other new protobuf definitions
- [ ] **Step 09**: New Event service
- [ ] **Step 10**: New Context service
- [ ] **Step 11**: New Tool service
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

Resources are identified by a simple Universal Resource Name (URN) formatted as
`urn_namespace:path` where:

- `urn_namespace` is the URN assignment and always set to "cld"
- `path` is parents' path plus the resource's own path element, joined by "/"
- Each path element consist of a resource type and ID joined by "."

Resources are stored using their URN as the object name. Here are examples
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
appropriate URN prefix.

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

The URN structure enables easy fetching of all parent resources. For example, a
sub Task URN like
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
                Asst->>Event: Subscribe to RESOURCE_PUT events<br/>with Task URN prefix filter

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
                Note over Asst: Fetch resources from Task URN path
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

### Step 07: Use `Resource` Type and `libresource`

**🎯 Objective**: Integrate resource system into existing services, replacing
deprecated text processing.

**📋 Tasks**:

- Replace Text service functionality with `libresource`
- Update `libvector` to index all resource types
- Extend Vector service with type and URN prefix filtering
- Update Agent service to use `ResourceIndex`

**🔧 Implementation Details**:

With the Text service deprecated, `libresource` takes over.

`libvector` needs to be updated to index all resources. Only the resource's
metadata is kept in the index, e.g. `common.MessageV2.meta` or `plan.Task.meta`.

When processing resources with `class VectorProcessor` the string returned by
`common.Resource.toDescription()` is used when creating the vector embedding.

`libvector` and the Vector service is extended with the ability to filter by the
resource's type, or by URN prefix.

In the Vector service:

```js
/* eslint-env node */
import { storageFactory } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";
import { common } from "@copilot-ld/libtype";

const vectorStorage = storageFactory("vectors");
const vectorIndex = new VectorIndex(vectorStorage);

// Example query vector - provided by the request
const vector = [0.1, 0.2, 0.3];

// Example filter - provided by the request
const filter = { type: "common.MessageV2" };

/** @type {common.Resource[]} */
const similarities = await vectorIndex.queryItems(vector, filter);
```

And in the Agent service:

```js
/* eslint-env node */
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { Policy } from "@copilot-ld/libpolicy";
import { common } from "@copilot-ld/libtype";

// Example assistant from previous context.
const assistant = new common.Assistant.fromObject({
  meta: { name: "data-expert" },
});

// Assume similarities is already defined from previous context
/** @type {common.Resource[]} **/
const similarities = [];

const actor = assistant.meta.id;
const ids = similarities.map((r) => r.id);

const resourceStorage = storageFactory("resources");
const policy = new Policy(storageFactory("policies"));
const resourceIndex = new ResourceIndex(resourceStorage, policy);

// Returns resources created as instances of the right type.
const instances = await resourceIndex.get(actor, ids);
```

**✅ Success Criteria**:

- Text service successfully replaced with resource-based processing
- Vector service supports type and URN filtering
- Agent service integrates with `ResourceIndex`
- All existing functionality preserved through resource abstraction
- Performance tests demonstrate no regression

### Step 08: Other New Protobuf Definitions

**🎯 Objective**: Define all remaining protobuf schemas needed for the new
architecture.

**📋 Tasks**:

- Add remaining types to `common.proto`
- Create `event.proto` for event streaming
- Create `context.proto` for context management
- Create `plan.proto` for task planning

**🔧 Implementation Details**:

In `common.proto`, these definitions are added:

```proto
// ... existing protobuf definitions, e.g. Choice, Usage

message Conversation {
  common.Resource meta = 1;
}

message Assistant {
  common.Resource meta = 1;
}

message PromptCompletion {
  // These compile to .messages with .toMessages()
  repeated MessageV2 instructions = 1;
  repeated MessageV2 context = 2;
  repeated MessageV2 history = 3;
  optional MessageV2 message = 4;

  repeated MessageV2 messages = 5;

  repeated Tool tools = 6;
  optional Usage usage = 7;
}

message PromptChoices {
  repeated Choice choices = 1;
  optional Usage usage = 2;
}
```

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

The `context.proto` definitions are added:

```proto
syntax = "proto3";

import "common.proto";

package context;

service Context {
  rpc GetWindow(WindowRequest) returns (Window);
  rpc OptimizeWindow(Window) returns (OptimizationResponse);
}

message WindowRequest {
  string id = 1;
}

message OptimizationResponse {
  bool successful = 1;
  bool optimized = 2;
}

message Window {
  string id = 1;
  repeated Resource resources = 2;
}
```

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

**✅ Success Criteria**:

- All protobuf schemas compile successfully
- Generated types are properly structured
- Import dependencies resolve correctly
- Type definitions support planned service implementations

### Steps 09-16: Service Implementation & Integration

**🎯 Objective**: Implement all new services and complete the architectural
transition.

**📋 Tasks**:

- **Step 09**: Implement Event service with streaming capabilities
- **Step 10**: Implement Context service for resource window management
- **Step 11**: Implement Tool service for function execution
- **Step 12**: Implement Plan service for task coordination
- **Step 13**: Implement Assistant service with supervisory and direct modes
- **Step 14**: Update extensions to use new Plan service patterns
- **Step 15**: Remove deprecated items and rename `MessageV2` to `Message`
- **Step 16**: Implement Graph tool for linked data relationships

**⚠️ Implementation Notes**:

- Each step builds on previous completed steps
- Services must follow established gRPC patterns from existing codebase
- All new services require comprehensive unit and integration tests
- Performance benchmarks must be established for each service
- Documentation must be updated incrementally with each service addition

**✅ Success Criteria for Each Step**:

- Service implements all protobuf-defined methods
- gRPC integration works with existing infrastructure
- Unit tests achieve >90% coverage
- Integration tests validate end-to-end functionality
- Performance meets or exceeds current system benchmarks
- Documentation reflects new capabilities
