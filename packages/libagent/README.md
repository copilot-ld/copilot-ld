# libagent

Agent orchestration library that coordinates LLM interactions, memory
management, and tool execution for conversational AI workflows.

## Usage

```javascript
import { AgentMind, AgentAction } from "@copilot-ld/libagent";

const mind = new AgentMind(memoryClient, llmClient, toolClient);
const response = await mind.process(request);
```

## API

| Export        | Description                           |
| ------------- | ------------------------------------- |
| `AgentMind`   | Core agent reasoning and conversation |
| `AgentAction` | Tool execution and action handling    |
