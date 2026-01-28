# libsupervision

Process supervision for managing long-running and one-shot service processes.

## Usage

```javascript
import { Supervisor, LongRunner, OneShot } from "@copilot-ld/libsupervision";

const supervisor = new Supervisor();
supervisor.add(new LongRunner("web", command, env));
supervisor.add(new OneShot("migrate", command, env));
await supervisor.start();
```

## API

| Export         | Description                              |
| -------------- | ---------------------------------------- |
| `ProcessState` | Process state management                 |
| `LogWriter`    | Log writing utilities                    |
| `LongRunner`   | Long-running process with restart        |
| `OneShot`      | One-shot process execution               |
| `Supervisor`   | Supervision tree (inspired by s6-svscan) |
