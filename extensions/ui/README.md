# UI Extension

Demo frontend for Copilot-LD that serves static files, provides runtime
configuration, and proxies authentication requests.

## Usage

```javascript
import ui from "@extensions/ui";

const app = await ui(config);
```

## API

| Method | Endpoint        | Description                        |
| ------ | --------------- | ---------------------------------- |
| GET    | `/ui/health`    | Health check endpoint              |
| GET    | `/ui/config.js` | Runtime configuration script       |
| ALL    | `/ui/auth/*`    | Auth proxy to GoTrue service       |
| GET    | `/ui/*`         | Static files from public directory |
