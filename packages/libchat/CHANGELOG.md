# Changelog

## 2026-01-20

- **BREAKING**: Complete redesign with composition over inheritance pattern
- Added `ChatClient` composed client for auth, API, and state management
- Added `ChatApi` class replacing function-based API
- Added `ChatState` class replacing function-based state management
- Renamed `AuthClient` to `ChatAuth` for consistency
- Renamed `<agent-drawer>` to `<chat-drawer>`
- Renamed `<agent-chat>` to `<chat-page>`
- Added `<chat-user>` authentication UI component
- Moved styles to `styles/` directory
- Moved elements to `elements/` directory
- Removed global `window.getAuthToken` pattern in favor of client injection
- Removed `data-chat-url` attribute (now configured via client)
- Changed event names from `agent:*` to `chat:*`

## 2026-01-17

- Added dark mode support via `prefers-color-scheme` media query
- Made drawer component responsive (adapts from phone to desktop screens)
- Improved chat component styling with ChatGPT-like centered layout
- Consolidated shared styles in `styles.js` (header, main, footer, form)
- Added border radius, shadows, and improved visual hierarchy

## 2026-01-15

- Initial release of libchat package
- Added `<agent-drawer>` component for collapsible chat interface
- Added `<agent-chat>` component for full-page chat interface
- Implemented shared state management with localStorage persistence
- Implemented CustomEvent communication for multi-instance sync
- Extracted from extensions/ui/public/ui/agent.js
