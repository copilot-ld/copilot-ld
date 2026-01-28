# Web Extension

Web chat API extension that provides a streaming chat endpoint with
authentication, validation, and HTML formatting of agent responses.

## Usage

```javascript
import web from "@extensions/web";

const app = await web(agentClient, config);
```

## API

| Method | Endpoint        | Description                              |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/web/health`   | Health check endpoint                    |
| POST   | `/web/api/chat` | Streaming chat endpoint with HTML output |
