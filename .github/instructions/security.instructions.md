---
applyTo: "**/*.js"
---

# Security Instructions

Defense-in-depth security through network isolation, input validation, and
secure error handling.

## Principles

1. **Network Isolation**: Backend services run on internal Docker networks only;
   extensions bridge internal/external
2. **Input Validation**: All user input is validated and sanitized before
   processing
3. **Secure Errors**: Error messages are sanitized to prevent information
   leakage
4. **No Secrets in Code**: Credentials use environment variables, never source
   files

## Requirements

### Network Architecture

```yaml
# docker-compose.yml
networks:
  app.external: { driver: bridge }
  app.internal: { driver: bridge, internal: true }

services:
  extension: # bridges both networks, exposes ports
    networks: [app.external, app.internal]
    ports: ["3000:3000"]
  backend-service: # internal only, NO ports section
    networks: [app.internal]
```

### Input Validation

Validate all request fields before processing:

```javascript
async RpcMethod(req) {
  if (!req.query || typeof req.query !== "string") {
    throw new Error("query required");
  }
  if (req.query.length > 5000) {
    throw new Error("query too long");
  }
  return this.#process(req.query);
}
```

### Error Sanitization

Strip sensitive data from error messages and logs:

```javascript
#sanitizeError(error) {
  return error.message
    .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, "[IP]")
    .replace(/[a-zA-Z0-9]{32,}/g, "[TOKEN]");
}

#sanitizeForLogging(request) {
  const copy = { ...request };
  delete copy.authToken;
  delete copy.apiKey;
  return copy;
}
```

## Prohibitions

1. **DO NOT** expose backend service ports to host network
2. **DO NOT** store secrets in source code or config files
3. **DO NOT** trust user input without validation
4. **DO NOT** log sensitive data (tokens, passwords, PII)
5. **DO NOT** implement custom cryptographic functions
6. **DO NOT** skip SSL certificate validation in production
