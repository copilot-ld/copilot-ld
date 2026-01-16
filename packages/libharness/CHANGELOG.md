# Changelog

## 2026-01-16

- Initial release of libharness test infrastructure
- Extracted from test/shared/ to enable reuse across repositories
- Provides mock factories for config, storage, logger, gRPC, HTTP, observers
- Includes service client mocks (memory, llm, agent, vector, graph, tool, trace)
- Provides test fixtures and assertions
- Supports customization via override parameters
