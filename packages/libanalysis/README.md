# @copilot-ld/libanalysis

Code analysis and formatting utilities for the Copilot-LD platform.

## Installation

```bash
npm install @copilot-ld/libanalysis
```

## Usage

### Format Markdown with Line Numbers

```javascript
import { formatForAnalysis } from "@copilot-ld/libanalysis";

const markdown = `# Example

This is a markdown document.`;

const formatted = await formatForAnalysis(markdown);
console.log(formatted);
```

## API

### `formatForAnalysis(markdown)`

Formats markdown content with Prettier and adds line numbers.

**Parameters:**

- `markdown` (string): The markdown content to format

**Returns:** Promise<string> - Formatted markdown with line numbers

## License

Apache-2.0
