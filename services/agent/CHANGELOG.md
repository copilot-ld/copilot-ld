# Changelog

## 2025-09-06

- Added redundant `function.name` field when building tool execution request to
  improve compatibility with Tool service name extraction
- Extended debug logging for converted tool calls including serialized built
  object

## 2025-09-05

- Removed legacy generated files `service.js` and `client.js` from
  `services/agent/` replaced by consolidated `generated/services/agent/`
  artifacts
- Added fallback tool discovery: when `MemoryService.GetWindow()` returns no
  tool identifiers, `AgentService` now calls `ToolService.ListTools()` to
  populate available function tools enabling immediate tool calling (e.g., `md5`
  hash) on first user prompt

## 2025-09-03

- Updated `Dockerfile` to copy renamed `scripts/` directory instead of `tools/`
- Integrated memory budget feature to pass `config.budget.tokens` and
  `config.budget.allocation` to `MemoryService.GetWindow()`
- Enhanced `GetWindow()` call to include token allocation parameters for
  `tools`, `history`, `tasks`, and `context` sections
- Improved memory management by applying token-based filtering to conversation
  history and context
- Preloaded `Assistant` resource and subtracted its `content.tokens` from the
  memory budget prior to window retrieval; recalculated per-section allocations
  based on the remaining budget

## 2025-09-02

memory budget prior to window retrieval; applied allocation percentages to the
final available token count when requesting the window resource-backed context

- Hardened error handling around resource retrieval during context assembly

## 2025-09-01

- Refactored `AgentService` to inject typed clients (`LlmClient`,
  `VectorClient`, `MemoryClient`) with explicit JSDoc types; updated server and
  tests accordingly

## 2025-08-28

- **BREAKING**: Replaced `Text` service dependency with `ResourceIndex` for
  improved resource management
- Fixed gRPC serialization errors by filtering `null` values from similarity
  results
- Enhanced resource retrieval using system actor `"cld:system"` for proper
  access control
- Streamlined content extraction from `MessageV2` objects using
  `String(resource.content)`

## 2025-08-18

- Updated `ProcessRequest()` method signature to use single `req` parameter with
  snake_case fields
- Improved alignment with new `base.js` handler for consistent API structure

## 2025-08-17

- Simplified generated `base.js` with centralized auth/error handling in
  `Service`
- Updated `ProcessRequest()` signature and streamlined `JSDoc` documentation for
  fields
