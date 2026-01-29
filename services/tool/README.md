# Tool Service

gRPC proxy that routes tool calls to appropriate service implementations based
on configuration.

## Usage

```javascript
import { ToolService } from "@services/tool";

const service = new ToolService(logger, tracer, endpointConfig);
```

## API

| Method | Description                                       |
| ------ | ------------------------------------------------- |
| `Call` | Routes tool calls to configured service endpoints |
