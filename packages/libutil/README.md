# libutil

Utility functions for tokenization, file finding, bundle downloading, and
environment management.

## Usage

```javascript
import {
  countTokens,
  generateHash,
  findProjectRoot,
} from "@copilot-ld/libutil";

const tokens = countTokens("Hello, world!");
const hash = generateHash("content");
const root = await findProjectRoot();
```

## API

| Export            | Description                         |
| ----------------- | ----------------------------------- |
| `updateEnvFile`   | Environment file manipulation       |
| `generateHash`    | SHA256 hash generation (16-char)    |
| `generateUuid`    | UUID generation                     |
| `countTokens`     | Token counting (GPT-style)          |
| `estimateTokens`  | Fast token estimation               |
| `createBundler`   | Download pre-generated code bundles |
| `exec`            | Execute command as child process    |
| `findProjectRoot` | Project path resolution             |
