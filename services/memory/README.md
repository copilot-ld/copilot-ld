# Memory Service

Manages transient resources and builds context windows for LLM calls with token
limits.

## Usage

```javascript
import { MemoryService } from "@services/memory";

const service = new MemoryService(storage, resourceIndex);
```

## API

| Method   | Description                                               |
| -------- | --------------------------------------------------------- |
| `Append` | Appends identifiers to a resource's memory index          |
| `Window` | Builds a token-limited context window with messages/tools |
