# librepl

Interactive REPL utilities and command-line interfaces with dependency
injection, state persistence, and custom commands.

## Usage

```javascript
import { Repl } from "@copilot-ld/librepl";

const repl = new Repl({
  prompt: "> ",
  commands: { help: () => "Available commands..." },
});
await repl.start();
```

## API

| Export | Description                           |
| ------ | ------------------------------------- |
| `Repl` | Interactive REPL with custom commands |
