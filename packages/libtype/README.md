# libtype

Shared type definitions and data models generated from Protocol Buffers with
runtime utilities.

## Usage

```javascript
import { common, agent, memory } from "@copilot-ld/libtype";

const request = agent.Request.fromObject({
  resourceId: common.ResourceId.fromObject({ type: "conversation" }),
  content: "Hello",
});
```

## API

| Namespace  | Description                           |
| ---------- | ------------------------------------- |
| `common`   | Common types (ResourceId, Identifier) |
| `agent`    | Agent request/response types          |
| `memory`   | Memory and window types               |
| `graph`    | Graph query types                     |
| `vector`   | Vector search types                   |
| `tool`     | Tool call types                       |
| `trace`    | Trace span types                      |
| `llm`      | LLM completion types                  |
| `resource` | Resource types                        |
