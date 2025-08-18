# Changelog

## 2025-08-18

- Updated `ProcessRequest()` method to use single `req` parameter instead of
  destructured object parameters
- Changed method signature from
  `ProcessRequest({ messages, session_id, github_token })` to
  `ProcessRequest(req)`
- Updated `ProcessRequest()` implementation to accept a single object with
  snake_case fields (`messages`, `session_id`, `github_token`) to align with new
  `base.js` handler.

## 2025-08-17

- Simplified generated `base.js`; centralized auth/error handling in `Service`.
- Updated `ProcessRequest()` signature/docs; streamlined `JSDoc` for fields.
