# librc

Service manager for Copilot-LD that manages service lifecycle through the svscan
supervision daemon.

## Usage

```javascript
import { ServiceManager, startServices } from "@copilot-ld/librc";

const manager = new ServiceManager(socketPath);
await manager.start("agent");
await manager.stop("agent");
```

## API

| Export           | Description                  |
| ---------------- | ---------------------------- |
| `ServiceManager` | Service lifecycle management |
| `startServices`  | Start multiple services      |
| `stopServices`   | Stop multiple services       |
