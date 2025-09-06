# Changelog

## 2025-09-05

- Removed legacy generated files `service.js` and `client.js` from
  `services/memory/` after relocation to `generated/services/memory/`

## 2025-09-03

- Implemented token budget filtering in `GetWindow()` method using
  `WindowRequest.allocation` parameters
- Added private `#filterByTokens()` method to limit identifiers based on token
  budget allocation
- Enhanced memory window assembly with token-aware filtering for `history`,
  `tasks`, and `context` sections
- Improved debugging output to include token allocation information

## 2024-12-23

- Switched memory format to JSON-ND and updated `Append()`/`GetWindow()` to use
  `identifiers`/`context`; leveraged `StorageInterface.append()` for efficient
  writes
- Updated to `ResourceIndex.findByPrefix()` and `Identifier` objects throughout

## 2025-09-01

- Initial implementation of `MemoryService` for managing transient resources
- Added `Append` method to store similarities for resources
- Added `GetWindow` method to retrieve memory windows with resource identifiers
- Created `MemoryClient` for gRPC communication with Memory service
- Integrated Memory service into Agent service replacing History service
  dependency
- Added `getByPrefix` method to `ResourceIndex` for URI-based resource queries
- Generated protobuf types for `memory.proto` definitions
- Added Memory service to docker-compose configuration with volume mounts
- Created Dockerfile for Memory service deployment
- Added Memory service to development tooling and configuration
