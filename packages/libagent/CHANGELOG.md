# Changelog

## 2025-10-15

- Bump version

## 2025-10-14

- **NEW**: Created `@copilot-ld/libagent` package with framework-agnostic agent
  orchestration logic
- Implemented `AgentMind` class for conversation setup, tool execution loops,
  and token budget management
- Implemented `AgentHands` class for focused tool execution with error handling
  and deduplication
- Extracted agent business logic from service layer to enable reuse and improve
  testability
- Comprehensive test coverage with integration tests for `AgentMind` and
  `AgentHands` classes
