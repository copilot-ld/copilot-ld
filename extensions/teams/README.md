# Teams Extension

Microsoft Teams bot integration using Bot Framework that enables multi-tenant
Copilot-LD conversations within Teams channels and direct messages.

## Usage

```javascript
import teams from "@extensions/teams";

const server = teams(agentClient, config);
```

## API

| Method | Endpoint        | Description                     |
| ------ | --------------- | ------------------------------- |
| POST   | `/api/messages` | Bot Framework protocol endpoint |
| GET    | `/api/settings` | Retrieve tenant configuration   |
| POST   | `/api/settings` | Save tenant configuration       |
| GET    | `/about`        | Static about page               |
| GET    | `/settings`     | Settings configuration page     |
