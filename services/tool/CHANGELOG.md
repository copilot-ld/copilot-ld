# Changelog

## 2025-09-06

- Added enhanced diagnostic logging for `ExecuteTool` including structural key
  dump and resolved name trace
- Implemented redundant `function.name` to aid downstream name extraction
- Added multi-stage tool name resolution with id synthesis when only
  `function.name` present
- Implemented safe JSON argument parsing with error capture instead of throw
- Added explicit log for resolved tool name to distinguish logging mismatch vs
  actual absence

## 2025-09-05

- Removed legacy generated files `service.js` and `client.js` from
  `services/tool/` due to unified `generated/services/tool/` output

## 2025-01-03

- Initial implementation of Tool service
- Added gRPC proxy functionality for tool execution
- Implemented `ExecuteTool` method with dynamic routing
- Implemented `ListTools` method for tool discovery
- Added configuration-driven endpoint mapping
- Fixed `ToolClient.ExecuteTool` to reference `common.ToolCallResult` instead of
  non-existent `tool.ToolCallResult`, preventing runtime `fromObject` errors
- Support for mapping to existing services (e.g., `vector.QueryItems`)
- Support for custom tool services (e.g., `toolbox.HashTools`)
- Added policy integration for tool access control
- Integrated with `ResourceIndex` for tool schema storage
