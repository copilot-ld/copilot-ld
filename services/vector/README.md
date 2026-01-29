# Vector Service

Performs semantic vector search over content using embeddings from the LLM
service.

## Usage

```javascript
import { VectorService } from "@services/vector";

const service = new VectorService(vectorIndex, llmClient);
```

## API

| Method   | Description                                         |
| -------- | --------------------------------------------------- |
| `Search` | Searches content using text converted to embeddings |
