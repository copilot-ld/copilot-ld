# Agent Service

Orchestrates agent requests through AgentMind, managing conversations,
sub-agents, and handoffs.

## Usage

```javascript
import { AgentService } from "@services/agent";

const service = new AgentService(agentMind, resourceIndex);
```

## API

| Method       | Description                                       |
| ------------ | ------------------------------------------------- |
| `Stream`     | Streams agent responses progressively             |
| `Request`    | Returns a single final agent response             |
| `ListAgents` | Lists available sub-agents for delegation         |
| `RunAgent`   | Executes a sub-agent in an isolated conversation  |
| `ListLabels` | Lists valid handoff labels from the current agent |
| `Handoff`    | Transfers conversation control to another agent   |
