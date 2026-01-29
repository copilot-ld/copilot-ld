# libresource

Typed resource management with access control for storing and retrieving
structured data.

## Usage

```javascript
import { createResourceIndex, toResourceId } from "@copilot-ld/libresource";

const index = await createResourceIndex(storage, policyIndex);
const resource = await index.get(resourceId);
```

## API

| Export                | Description                          |
| --------------------- | ------------------------------------ |
| `ResourceIndex`       | Resource storage with access control |
| `toInstance`          | Convert objects to typed instances   |
| `toResourceId`        | Parse resource URI strings           |
| `createResourceIndex` | Factory for ResourceIndex            |
