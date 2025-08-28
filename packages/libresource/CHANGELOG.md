# Changelog

## 2025-08-28

- Fixed `DESCRIPTOR_PROMPT` to prevent LLM from responding with markdown code
  blocks instead of raw JSON
- Enhanced formatting requirements to explicitly request raw JSON starting with
  `{` and ending with `}`
- Enhanced `DESCRIPTOR_PROMPT` in `ResourceProcessor` for more effective AI
  agent resource understanding
- Improved prompt specificity with clear examples and AI agent context
- Added guidance for actionable decision-making criteria in resource descriptors
- Refactored LLM prompt template into `DESCRIPTOR_PROMPT` constant for better
  maintainability
- Enhanced `ResourceProcessor` to generate semantic descriptors using LLM
  completions through `libcopilot`
- Added `LlmInterface` dependency to `ResourceProcessor` constructor for
  descriptor generation
- Updated `package.json` to include `@copilot-ld/libcopilot` dependency
- Fixed `ResourceIndex.put()` method to properly serialize Protocol Buffer
  encoded data by calling `.finish()` on the writer
- Consolidated resource management features into stable `libresource` package
- Enhanced `ResourceIndex` with `getAll()` method for bulk resource retrieval
  with policy filtering
- Implemented universal resource identification system using `URI` format for
  consistent addressing

## 2025-08-25

- Initial implementation of `ResourceIndex` class for typed resource management
- Added `ResourceProcessor` for chunking resource content
- Added policy integration for access control
