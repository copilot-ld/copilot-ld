# libsecret

Secret generation and environment file utilities for managing credentials and
configuration.

## Usage

```javascript
import { generateSecret, getEnvVar, setEnvVar } from "@copilot-ld/libsecret";

const secret = generateSecret();
await setEnvVar(".env", "API_SECRET", secret);
const value = await getEnvVar(".env", "API_SECRET");
```

## API

| Export              | Description                         |
| ------------------- | ----------------------------------- |
| `getEnvVar`         | Read env var from .env file         |
| `getOrCreateSecret` | Get existing or generate new secret |
| `setEnvVar`         | Update/create env var in .env       |
| `hashValues`        | Deterministic hash from values      |
| `generateId`        | Generate unique identifier          |
| `generateSecret`    | Cryptographic random secret         |
| `generateSecretB64` | Base64url-encoded random secret     |
| `createJwt`         | Create HS256-signed JWT             |
