# libtelemetry

OpenTelemetry-based logging, tracing, and observability for microservices.

## Usage

```javascript
import { createLogger, Logger, observe } from "@copilot-ld/libtelemetry";
import { Tracer } from "@copilot-ld/libtelemetry/tracer.js";

const logger = createLogger("my-service");
logger.info("Service started");

const tracer = new Tracer(storage);
const span = tracer.startSpan("operation");
```

## API

| Export            | Description                           |
| ----------------- | ------------------------------------- |
| `createLogger`    | RFC 5424 compliant logger factory     |
| `Logger`          | Logger class                          |
| `observe`         | Observability utilities               |
| `Tracer`          | Distributed tracing (separate import) |
| `TraceVisualizer` | Trace visualization (separate import) |
| `TraceIndex`      | Trace storage index (separate import) |
