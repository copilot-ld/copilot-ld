# Changelog

## 2026-01-16

- Added Supabase authentication integration with login page
- Added `auth.js` module for frontend authentication with `signIn()`,
  `signOut()`, `getSession()`, and `authFetch()` helpers
- Updated `/ui/config.js` endpoint to include `SUPABASE_URL` and
  `SUPABASE_ANON_KEY`
- Added login link to navigation

## 2026-01-15

- Migrated agent chat component to `@copilot-ld/libchat` package
- Added `<agent-drawer>` and `<agent-chat>` web components from libchat
- Removed legacy `public/ui/agent.js` file

## 2025-11-30

- Implemented streaming support in chat UI
- Improved stream buffer handling and error reporting

## 2025-11-25

- Initial release of UI extension
- Moved static content from web extension
