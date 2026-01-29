# libvector

Vector operations and index management for similarity search.

## Usage

```javascript
import { VectorIndex } from "@copilot-ld/libvector/index.js";

const index = new VectorIndex(storage, namespace);
const results = await index.search(queryVector, { limit: 10, threshold: 0.7 });
```

## API

| Export            | Description                         |
| ----------------- | ----------------------------------- |
| `VectorIndex`     | Vector index with cosine similarity |
| `VectorProcessor` | Vector processing utilities         |
