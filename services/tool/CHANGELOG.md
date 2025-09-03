# Changelog

## 2025-01-03

- Initial implementation of Tool service
- Added gRPC proxy functionality for tool execution
- Implemented `ExecuteTool` method with dynamic routing
- Implemented `ListTools` method for tool discovery
- Added configuration-driven endpoint mapping
- Support for mapping to existing services (e.g., `vector.QueryItems`)
- Support for custom tool services (e.g., `toolbox.HashTools`)
- Added policy integration for tool access control
- Integrated with `ResourceIndex` for tool schema storage
