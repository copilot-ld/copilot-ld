# Changelog

## 2026-01-15

- Integrated `AuthMiddleware` for optional JWT authentication on `/web/api/chat`
- Added `Authorization` to CORS `allowHeaders`
- Added `authEnabled` config option to enable/disable authentication

## 2025-11-30

- Implemented streaming support for chat API using NDJSON
- Added error handling within the stream to prevent silent failures
- Restored server-side Markdown-to-HTML formatting for streamed chunks

## 2025-11-25

- Removed static file serving (moved to `ui` extension)
- Reverted health check to `/web/health`

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

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-10-07

- Simplified development workflow by removing `--env-file` flag from `dev`
  script

## 2025-09-26

- **BREAKING**: Updated client imports to use `@copilot-ld/librpc` aggregated
  exports instead of local `generated/` files
- **CONTAINERIZATION**: Simplified `Dockerfile` to use standalone
  `node:22-alpine` base with private `@copilot-ld` packages via `.npmrc`
- **IMPORTS**: Enhanced extension to use destructured imports:
  `const { AgentClient } = clients;`

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- Fixed protobuf type creation using `agent.AgentRequest.fromObject()` instead
  of plain objects
- Updated dependencies for architectural restructuring (`libservice` → `librpc`)
- Updated container configuration to reference renamed `scripts/` directory
- Enhanced integration with consolidated service architecture

## 2025-08-12

- Initial web extension implementation
- Added `Docker` container for web interface
- Added static files in `public/` directory
- Version `v1.0.0`
