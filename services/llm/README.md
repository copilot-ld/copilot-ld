# LLM Service

Provides LLM completions and embeddings by delegating to configured LLM
providers.

## Usage

```javascript
import { LlmService } from "@services/llm";

const service = new LlmService(memoryClient, llmApiFactory);
```

## API

| Method       | Description                                           |
| ------------ | ----------------------------------------------------- |
| `Completion` | Creates LLM completions using a memory window context |
| `Embed`      | Creates vector embeddings for input text              |
