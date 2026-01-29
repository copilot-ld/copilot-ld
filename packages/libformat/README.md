# libformat

Markdown formatting and text processing utilities that convert markdown to HTML
or terminal output with ANSI codes.

## Usage

```javascript
import { toHtml, toTerminal } from "@copilot-ld/libformat";

const html = toHtml(markdown);
const terminal = toTerminal(markdown);
```

## API

| Export             | Description                         |
| ------------------ | ----------------------------------- |
| `toHtml`           | Convert markdown to sanitized HTML  |
| `toTerminal`       | Convert markdown to terminal output |
| `createToHtml`     | Factory with injected dependencies  |
| `createToTerminal` | Factory with injected dependencies  |
