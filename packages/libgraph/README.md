# libgraph

RDF graph index and processing utilities for storing, querying, and serializing
linked data using the N3 library.

## Usage

```javascript
import { createGraphIndex, PREFIXES } from "@copilot-ld/libgraph";

const index = await createGraphIndex(storage, namespace);
const results = await index.query(subject, predicate, object);
```

## API

| Export             | Description                       |
| ------------------ | --------------------------------- |
| `PREFIXES`         | Standard namespace prefixes       |
| `isWildcard`       | Check for wildcard query values   |
| `parseTripleQuery` | Parse triple queries from strings |
| `createGraphIndex` | Factory for GraphIndex instances  |
| `serializeShacl`   | SHACL constraint serialization    |
