# libllm

LLM API client with direct HTTP calls to OpenAI-compatible endpoints, including
GitHub Models support.

## Usage

```javascript
import { LlmApi } from "@copilot-ld/libllm";

const api = new LlmApi(config, logger);
const response = await api.completion(messages, options);
```

## API

| Export               | Description                           |
| -------------------- | ------------------------------------- |
| `LlmApi`             | LLM client for completions/embeddings |
| `DEFAULT_MAX_TOKENS` | Default token limit constant          |
