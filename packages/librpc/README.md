# librpc

gRPC framework and utilities providing client/server infrastructure for
inter-service communication.

## Usage

```javascript
import {
  RpcServer,
  createClientFactory,
  createTracer,
} from "@copilot-ld/librpc";

const server = new RpcServer(services, config);
await server.start();

const factory = createClientFactory(logger, tracer);
const client = factory.createAgentClient(host, port);
```

## API

| Export                | Description                      |
| --------------------- | -------------------------------- |
| `loadProto`           | Load Protocol Buffer definitions |
| `createService`       | Create gRPC service handlers     |
| `RpcClient`           | Base gRPC client class           |
| `RpcServer`           | Base gRPC server class           |
| `hmacAuth`            | HMAC authentication middleware   |
| `getServiceClass`     | Runtime service class access     |
| `createTracer`        | Distributed tracing factory      |
| `createClientFactory` | Service client factory           |
