# Changelog

## 2025-10-24

- **Fixed**: Token budget is now divided across tool calls in
  `AgentHands.processToolCalls()` before calling services, preventing LLM token
  limit errors when multiple tool calls return large result sets
- **Removed**: Eliminated post-processing token truncation logic in favor of
  upfront budget allocation to tool services
- **Removed**: Removed unused `countTokens` import from `@copilot-ld/libutil`
- **Fixed**: Memory window token filtering now works correctly - identifiers
  appended to memory now include `tokens` field from message content, enabling
  proper token budget enforcement via `MemoryFilter.filterByBudget()`

## 2025-10-22

- Added `bin/assistants.js` binary for processing assistant configurations
- Updated `package.json` with `bin` field to enable `npx assistants` command
- Moved assistant processing logic from `scripts/assistants.js` to package
  binary

## 2025-10-19

- Bump version
- Refactored `AgentMind` to accept `AgentHands` as a constructor dependency
  instead of using dynamic import
- Updated constructor signature:
  `AgentMind(config, callbacks, resourceIndex, agentHands)`
- Removed dynamic `import("./hands.js")` from `processRequest()` method
- All imports are now static for improved predictability and tree-shaking

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
