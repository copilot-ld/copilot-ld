# libweb

Shared web extension utilities and security middleware for HTTP APIs.

## Usage

```javascript
import {
  authMiddleware,
  corsMiddleware,
  validationMiddleware,
} from "@copilot-ld/libweb";

app.use(corsMiddleware(config));
app.use(authMiddleware(authConfig));
app.use(validationMiddleware(schema));
```

## API

| Export                 | Description                   |
| ---------------------- | ----------------------------- |
| `authMiddleware`       | JWT authentication middleware |
| `createAuthMiddleware` | Auth middleware factory       |
| `corsMiddleware`       | CORS handling middleware      |
| `createCorsMiddleware` | CORS middleware factory       |
| `validationMiddleware` | Request validation middleware |
| `createValidation`     | Validation middleware factory |
