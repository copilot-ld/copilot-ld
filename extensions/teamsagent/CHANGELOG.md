# Changelog

## 2025-12-03

- Changed `ProcessRequest` to `ProcessUnary` for agent client calls
- Response now returns `messages` array directly matching `AgentResponse`
  protobuf
- Removed transformation layer for cleaner pass-through of gRPC response
