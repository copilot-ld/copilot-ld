# @copilot-ld/libchat

Chat web components for Copilot-LD. Framework-agnostic, self-contained web
components built with the Web Components standard (Custom Elements V1, Shadow
DOM V1).

## Features

- **`<agent-drawer>`** - Collapsible drawer chat interface for any web page
- **`<agent-chat>`** - Full-page chat interface for dedicated chat pages
- **Zero Dependencies** - Pure vanilla JavaScript, works anywhere
- **Shadow DOM Encapsulation** - No style conflicts
- **Shared State** - Multiple instances sync automatically
- **LocalStorage Persistence** - Conversations persist across page reloads
- **CustomEvent Communication** - Components communicate via standard DOM events

## Quick Start

### NPM Installation

```bash
npm install @copilot-ld/libchat
```

```html
<script type="module" src="node_modules/@copilot-ld/libchat/drawer.js"></script>
<agent-drawer data-api="/api" data-name="Support Agent"></agent-drawer>
```

### CDN Usage

```html
<script
  type="module"
  src="https://cdn.example.com/@copilot-ld/libchat@0.1.0/dist/drawer.js"
></script>
<agent-drawer data-api="/api" data-name="Support Agent"></agent-drawer>
```

## Components

### `<agent-drawer>`

Collapsible drawer that appears in the bottom-right corner. Expands to show chat
interface.

**Attributes:**

- `data-api` - API endpoint URL (default: `${window.location.origin}/web/api`)
- `data-name` - Agent display name (default: "Agent")
- `data-placeholder` - Input placeholder text (optional)

**Example:**

```html
<agent-drawer
  data-api="/web/api"
  data-name="Agent Walter"
  data-placeholder="Ask me anything..."
>
</agent-drawer>
<script type="module" src="/path/to/drawer.js"></script>
```

**Events:**

- `agent:message` - Dispatched when messages update (bubbles, composed)
- `agent:session-clear` - Dispatched when session is cleared (bubbles, composed)

### `<agent-chat>`

Full-page chat interface suitable for dedicated chat pages.

**Attributes:**

- `data-api` - API endpoint URL (default: `${window.location.origin}/web/api`)
- `data-name` - Agent display name (default: "Agent")
- `data-placeholder` - Input placeholder text (optional)

**Example:**

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        height: 100vh;
      }
      agent-chat {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <agent-chat data-name="Agent Walter"></agent-chat>
    <script type="module" src="/path/to/chat.js"></script>
  </body>
</html>
```

**Events:**

- `agent:message` - Dispatched when messages update (bubbles, composed)
- `agent:session-clear` - Dispatched when session is cleared (bubbles, composed)

## Styling & Theming

Components use CSS custom properties for theming. Override in your own CSS:

```css
agent-drawer {
  /* Colors */
  --agent-primary-color: #ff6600;
  --agent-background: #f5f5f5;
  --agent-text-color: #333;

  /* Spacing */
  --agent-padding: 1.5rem;
  --agent-border-radius: 8px;

  /* Z-index */
  --agent-z-index: 9999;
}
```

## Architecture Decision: CSS in JavaScript

CSS styles are defined as template strings in `.js` files (e.g., `styles.js`,
`drawer-styles.js`) rather than separate `.css` files. This is an intentional
design decision to support:

1. **Zero-Build Development** - Components load directly from source without
   compilation
2. **Shadow DOM Injection** - Styles are programmatically injected into
   component shadow roots
3. **Self-Contained Components** - No external CSS file loading or FOUC
4. **Simple Development Workflow** - UI service serves components directly from
   package source

**Development (source):**

```html
<!-- Styles are inlined in JS modules -->
<script type="module" src="/ui/libchat/drawer.js"></script>
```

**Production (bundled):**

```html
<!-- Build process creates minified bundles with inlined CSS -->
<script
  type="module"
  src="https://cdn.example.com/@copilot-ld/libchat@0.1.0/dist/drawer.js"
></script>
```

This tradeoff prioritizes developer experience and deployment simplicity over
IDE features like CSS syntax highlighting in separate files.

## API Contract

Components expect a streaming chat API endpoint:

**POST /web/api/chat**

Request:

```json
{
  "message": "Hello",
  "resource_id": "conversation-123"
}
```

For a new conversation, omit the `resource_id` field.

Response (newline-delimited JSON stream):

```json
{ "resource_id": "conversation-123" }
{ "messages": [{ "role": "assistant", "content": "Hello! " }] }
{ "messages": [{ "role": "assistant", "content": "How can I help?" }] }
```

Error response:

```json
{ "error": "Rate limit exceeded", "details": "..." }
```

## State Management

Components use three-tier state management:

1. **Module-Level Shared State** - In-memory Map shared across all instances
2. **LocalStorage Persistence** - Conversations persist across page reloads
3. **CustomEvent Communication** - Components sync via DOM events

Multiple drawer/chat instances on the same page automatically share conversation
state.

## Browser Requirements

- ES Modules support
- Custom Elements V1
- Shadow DOM V1
- Fetch API with ReadableStream

Modern browsers only (Chrome 67+, Firefox 63+, Safari 12+, Edge 79+). No
polyfills provided.

## Framework Integration

### Vanilla JavaScript

```html
<agent-drawer data-name="Agent"></agent-drawer>
<script type="module" src="./drawer.js"></script>
```

### React

```jsx
import "@copilot-ld/libchat/drawer.js";

function App() {
  return <agent-drawer data-name="Agent" />;
}
```

### Vue

```vue
<template>
  <agent-drawer data-name="Agent"></agent-drawer>
</template>

<script>
import "@copilot-ld/libchat/drawer.js";
export default { name: "App" };
</script>
```

### Angular

```typescript
import "@copilot-ld/libchat/drawer.js";

@Component({
  selector: "app-root",
  template: '<agent-drawer data-name="Agent"></agent-drawer>',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {}
```

## Development

Build production bundles:

```bash
npm run build
```

This creates minified bundles in `dist/`:

- `drawer.js` - Drawer component with inlined CSS
- `chat.js` - Chat component with inlined CSS
- `bundle.js` - All components

## License

Apache-2.0
