# libdoc

Documentation build and serve tools for static site generation from Markdown
files with templating support.

## Usage

```javascript
import { build, serve, parseFrontMatter } from "@copilot-ld/libdoc";

await build({ srcDir: "docs", outDir: "public" });
await serve({ port: 3000 });
```

## API

| Export             | Description                      |
| ------------------ | -------------------------------- |
| `build`            | Build static documentation sites |
| `serve`            | Serve documentation locally      |
| `parseFrontMatter` | Parse YAML front matter          |
