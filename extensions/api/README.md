# API Extension

REST API extension that exposes Copilot-LD agent capabilities through a simple
HTTP endpoint for external integrations.

## Usage

```javascript
import api from "@extensions/api";

const app = api(agentClient, config);
```

## API

| Method | Endpoint   | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| POST   | `/api/ask` | Send message to agent, returns JSON response |

Requires Bearer token authentication.
