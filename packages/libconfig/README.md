# libconfig

Configuration management and environment resolution that loads settings from
files, environment variables, and storage backends.

## Usage

```javascript
import { serviceConfig, extensionConfig } from "@copilot-ld/libconfig";

const config = serviceConfig("agent");
console.log(config.get("HOST"));
```

## API

| Export            | Description                      |
| ----------------- | -------------------------------- |
| `createConfig`    | Generic config factory           |
| `serviceConfig`   | Service namespace config         |
| `extensionConfig` | Extension namespace config       |
| `scriptConfig`    | Script namespace config          |
| `initConfig`      | Bootstrap/init config            |
| `Configuration`   | Configuration class for advanced |
