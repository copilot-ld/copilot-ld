# Changelog

## 2025-11-22

- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-26

- Added performance tests in `test/libagent.perf.js`

## 2025-10-24

- **Fixed**: Token budget management - budget now divided across tool calls
  upfront and memory identifiers include `tokens` field for proper filtering

## 2025-10-22

- Added `bin/assistants.js` binary for processing assistant configurations via
  `npx assistants` command

## 2025-10-19

- **REFACTOR**: Simplified `AgentMind` constructor to accept `AgentHands`
  dependency directly instead of dynamic import

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
