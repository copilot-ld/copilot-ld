# Trace Service

Receives, stores, and queries trace spans for distributed tracing and
observability.

## Usage

```javascript
import { TraceService } from "@services/trace";

const service = new TraceService(storage);
```

## API

| Method  | Description                                     |
| ------- | ----------------------------------------------- |
| `Write` | Records a span to the trace index               |
| `Query` | Queries spans by text, trace_id, or resource_id |
