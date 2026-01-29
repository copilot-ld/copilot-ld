# libstorage

Storage abstraction layer supporting local filesystem, S3, and Supabase
backends.

## Usage

```javascript
import { createStorage, LocalStorage } from "@copilot-ld/libstorage";

const storage = createStorage(config);
await storage.write("path/file.json", data);
const content = await storage.read("path/file.json");
```

## API

| Export            | Description                     |
| ----------------- | ------------------------------- |
| `createStorage`   | Factory based on environment    |
| `LocalStorage`    | Local filesystem implementation |
| `S3Storage`       | AWS S3 implementation           |
| `SupabaseStorage` | Supabase storage implementation |
| `parseJsonl`      | Parse JSONL content             |
| `serializeJsonl`  | Serialize to JSONL              |
