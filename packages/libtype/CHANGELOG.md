# Changelog

## 2025-08-18

- Added `common.Prompt.prototype.fromMessages()` method to reconstruct `Prompt`
  objects from messages array (reverse of `toMessages()`)
- Added tests for `common.Prompt.prototype.toMessages()` and
  `common.Prompt.prototype.fromMessages()` methods in
  `packages/libtype/test/libtype.test.js`
- Added re-exports for request/response types: `AgentRequest`, `AgentResponse`,
  `GetHistoryRequest`, `GetHistoryResponse`, `UpdateHistoryRequest`,
  `UpdateHistoryResponse`, `EmbeddingRequest`, `EmbeddingResponse`,
  `CompletionRequest`, `CompletionResponse`, `GetChunksRequest`,
  `GetChunksResponse`, `QueryItemsRequest`, `QueryItemsResponse` from
  `libtype/index.js`

- Added test verifying `chunk instanceof Chunk` in
  `packages/libtype/test/libtype.test.js`

## 2025-01-24

- Added exports for all generated protobuf schemas from `generated/` directory

## 2025-08-12

- Initial `libtype` package implementation
- Added type definitions and object utilities
- Version `v1.0.0`
