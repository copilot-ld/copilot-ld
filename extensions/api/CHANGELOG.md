# Changelog

## 2025-12-03

- Changed `ProcessRequest` to `ProcessUnary` for agent client calls
- Response now returns `messages` array directly matching `AgentResponse`
  protobuf
- Removed transformation layer for cleaner pass-through of gRPC response
- Added `Server` class for HTTP server implementation
- Added `LocalSecretAuthorizer` for Bearer token authentication
- Added `parseBody()` function for HTTP request body parsing
- Added `createServer()` factory function with dependency injection
- Added POST `/api/messages` endpoint for agent request processing
- Added comprehensive test suite for server, auth, and HTTP utilities
- Added `README` with setup and usage instructions
- Renamed the extension to `api`
