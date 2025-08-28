# Changelog

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
