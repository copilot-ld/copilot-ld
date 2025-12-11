# @copilot-ld/libingest

File ingestion utility for Copilot-LD.

## Purpose

- Scans the `data/ingest` folder for `.pdf` files
- For each PDF found:
  - Computes the SHA-256 hash of the file
  - Creates a new folder named after the hash
  - Moves the PDF into the new folder
  - Writes a `context.json` file with the file name, extension, and mime type

## Usage

```js
import { Ingestor } from "@copilot-ld/libingest";
const ingestor = new Ingestor("data/ingest");
await ingestor.process();
```

## Output Structure

```
data/ingest/
  <sha256>/
    original.pdf
    context.json
```

## License

MIT
