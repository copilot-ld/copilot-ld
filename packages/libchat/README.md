# @copilot-ld/libchat

Chat web components for Copilot-LD. Framework-agnostic, self-contained web
components built with the Web Components standard (Custom Elements V1, Shadow
DOM V1).

## Features

- **`ChatClient`** - Composed client for auth, API, and state management
- **`<chat-drawer>`** - Collapsible drawer chat interface for any web page
- **`<chat-page>`** - Full-page chat interface for dedicated chat pages
- **`<chat-user>`** - Authentication UI component (login/logout)
- **Zero Dependencies** - Pure vanilla JavaScript, works anywhere
- **Shadow DOM Encapsulation** - No style conflicts
- **Dependency Injection** - Testable, mockable client architecture
- **LocalStorage Persistence** - Conversations persist across page reloads

## Quick Start

### NPM Installation

```bash
npm install @copilot-ld/libchat
```

```html
<script type="module">
  import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";

  const client = new ChatClient({
    chatUrl: "/api",
    auth: {
      url: "http://localhost:9999",
      anonKey: "your-anon-key",
    },
  });

  document.querySelector("chat-drawer").client = client;
</script>

<chat-drawer data-name="Support Agent"></chat-drawer>
```

### CDN Usage

```html
<script type="module">
  import {
    ChatClient,
    ChatDrawerElement,
  } from "https://cdn.example.com/@copilot-ld/libchat/index.js";

  const client = new ChatClient({ chatUrl: "/api" });
  document.querySelector("chat-drawer").client = client;
</script>

<chat-drawer data-name="Support Agent"></chat-drawer>
```

## ChatClient

The `ChatClient` composes authentication, API communication, and state
management into a single injectable dependency.

```javascript
import { ChatClient } from "@copilot-ld/libchat";

// Without authentication
const client = new ChatClient({ chatUrl: "/api" });

// With authentication
const client = new ChatClient({
  chatUrl: "/api",
  auth: {
    url: "http://localhost:9999",
    anonKey: "your-anon-key",
  },
});

// Send a message and stream the response
for await (const chunk of client.chat("Hello")) {
  console.log(chunk);
}

// Access individual services
client.auth; // ChatAuth instance (or null)
client.api; // ChatApi instance
client.state; // ChatState instance

// Clear conversation
client.clear();
```

## Components

### `<chat-drawer>`

Collapsible drawer that appears in the bottom-right corner.

**Attributes:**

- `data-name` - Agent display name (default: "Agent")
- `data-placeholder` - Input placeholder text (optional)

**Example:**

```html
<chat-drawer data-name="Agent Walter"></chat-drawer>

<script type="module">
  import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";

  const client = new ChatClient({ chatUrl: "/api" });
  document.querySelector("chat-drawer").client = client;
</script>
```

**Events:**

- `chat:message` - Dispatched when messages update (bubbles, composed)
- `chat:clear` - Dispatched when session is cleared (bubbles, composed)

### `<chat-page>`

Full-page chat interface suitable for dedicated chat pages.

**Attributes:**

- `data-name` - Agent display name (default: "Agent")
- `data-placeholder` - Input placeholder text (optional)

**Example:**

```html
<style>
  body {
    margin: 0;
    height: 100vh;
  }
  chat-page {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>

<chat-page data-name="Agent Walter"></chat-page>

<script type="module">
  import { ChatClient, ChatPageElement } from "@copilot-ld/libchat";

  const client = new ChatClient({ chatUrl: "/api" });
  document.querySelector("chat-page").client = client;
</script>
```

### `<chat-user>`

Authentication UI component for login/logout flows.

**Events:**

- `chat:login` - Dispatched when user logs in (bubbles, composed)
- `chat:logout` - Dispatched when user logs out (bubbles, composed)
- `chat:error` - Dispatched on authentication error (bubbles, composed)

**Example:**

```html
<chat-user></chat-user>

<script type="module">
  import { ChatClient, ChatUserElement } from "@copilot-ld/libchat";

  const client = new ChatClient({
    chatUrl: "/api",
    auth: { url: "http://localhost:9999" },
  });
  document.querySelector("chat-user").client = client;

  document.querySelector("chat-user").addEventListener("chat:login", (e) => {
    console.log("Logged in:", e.detail.email);
  });
</script>
```

## Styling & Theming

Components use CSS custom properties for theming. Override in your CSS:

```css
chat-drawer {
  /* Colors */
  --chat-color-accent: #ff6600;
  --chat-color-bg: #f5f5f5;
  --chat-color-text: #333;

  /* Spacing */
  --chat-padding: 1.5rem;
  --chat-radius: 8px;

  /* Z-index */
  --chat-z-index: 9999;
}
```

## API Contract

Components expect a streaming chat API endpoint:

**POST /api/chat**

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

## Framework Integration

### React

```jsx
import { useEffect, useRef } from "react";
import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";

const client = new ChatClient({ chatUrl: "/api" });

function App() {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (drawerRef.current) {
      drawerRef.current.client = client;
    }
  }, []);

  return <chat-drawer ref={drawerRef} data-name="Agent" />;
}
```

### Vue

```vue
<template>
  <chat-drawer ref="drawer" data-name="Agent"></chat-drawer>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";

const drawer = ref(null);
const client = new ChatClient({ chatUrl: "/api" });

onMounted(() => {
  drawer.value.client = client;
});
</script>
```

## Browser Requirements

- ES Modules support
- Custom Elements V1
- Shadow DOM V1
- Fetch API with ReadableStream

Modern browsers only (Chrome 67+, Firefox 63+, Safari 12+, Edge 79+).

## License

Apache-2.0
