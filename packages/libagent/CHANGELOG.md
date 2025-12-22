# Changelog

## 2025-12-21

- `AgentMind.setupConversation()` now supports `req.assistant` to override the
  default assistant

## 2025-12-02

- Fixed `processToolCalls()` to decrement remaining budget after each tool call
  within the same batch, preventing combined tool results from exceeding budget
- `AgentMind.process()` now defaults `model` from config when not provided in
  request
- `AgentHands.executeToolLoop()` now queries budget from Memory service
- Tool calls receive `max_tokens` filter based on remaining budget
- `processToolCalls()` returns total tokens used for budget tracking

## 2025-12-01

- Renamed `AgentMind.processRequest()` to `AgentMind.process()`

## 2025-11-30

- **BREAKING**: `AgentHands` constructor requires `resourceIndex` as third
  parameter; `executeToolLoop()` takes `(conversationId, saveResource, options)`
- **BREAKING**: `AgentMind` delegates tool loop to `AgentHands`; removed
  `buildMessages()`, `calculateBudget()`, `getMemoryWindow()` methods
- Simplified config: `budget` is now a number, `permanent_tools` renamed to
  `tools`
- Tool results use `tool.ToolCallMessage` type for correct persistence and LLM
  context

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
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
