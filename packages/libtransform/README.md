# libtransform

Resource transformations, primarily PDF-to-HTML conversion using LLM vision
capabilities.

## Usage

```javascript
import { pdfToHtml } from "@copilot-ld/libtransform";

const html = await pdfToHtml(pdfBuffer, { model: "gpt-4-vision" });
```

## API

| Export      | Description                          |
| ----------- | ------------------------------------ |
| `pdfToHtml` | Convert PDF to HTML using LLM vision |
