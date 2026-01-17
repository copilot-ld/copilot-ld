# Changelog

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
