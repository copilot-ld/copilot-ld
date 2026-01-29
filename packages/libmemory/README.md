# libmemory

Memory management library for building conversation history windows with budget
constraints based on model token limits.

## Usage

```javascript
import { WindowBuilder, createWindow } from "@copilot-ld/libmemory";

const builder = new WindowBuilder(tokenizer);
const window = await builder.build(messages, tools, budget);
```

## API

| Export          | Description                              |
| --------------- | ---------------------------------------- |
| `WindowBuilder` | Build context windows with token budgets |
| `createWindow`  | Factory function for window building     |
| `MemoryIndex`   | Conversation history index (subpath)     |
