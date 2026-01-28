# libpolicy

Policy engine foundation for access control evaluation with planned OPA-WASM
integration.

## Usage

```javascript
import { createPolicyIndex, PolicyIndex } from "@copilot-ld/libpolicy";

const index = await createPolicyIndex(storage);
const allowed = await index.evaluate(actor, resource, action);
```

## API

| Export              | Description                       |
| ------------------- | --------------------------------- |
| `PolicyIndex`       | Policy storage and evaluation     |
| `createPolicyIndex` | Factory for PolicyIndex instances |
