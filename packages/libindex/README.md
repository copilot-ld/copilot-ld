# libindex

Base index class for storage-backed indexes providing shared filtering logic and
JSONL storage operations.

## Usage

```javascript
import { Index, BufferedIndex } from "@copilot-ld/libindex";

class MyIndex extends Index {
  constructor(storage) {
    super(storage, "my-namespace");
  }
}
```

## API

| Export          | Description                            |
| --------------- | -------------------------------------- |
| `Index`         | Base class for storage-backed indexes  |
| `BufferedIndex` | High-volume writes with periodic flush |
