# @copilot-ld/libingest

Composable document ingestion pipeline for converting files to structured HTML.

## Capabilities

- PDF → HTML with Schema.org annotations
- PowerPoint → HTML with semantic structure
- Images → HTML with OCR and annotation
- Configurable pipeline steps via `config/ingest.yml`

## Pipeline Steps

| Step              | Input          | Output                  |
| ----------------- | -------------- | ----------------------- |
| `pdf-to-images`   | PDF/PPTX       | PNG images per page     |
| `images-to-html`  | PNG images     | Raw semantic HTML       |
| `extract-context` | HTML           | Document context JSON   |
| `annotate-html`   | HTML + context | Schema.org annotated    |
| `normalize-html`  | Annotated HTML | Normalized final output |

## Usage

```bash
# Drop files in data/ingest/in/
cp document.pdf data/ingest/in/

# Run pipeline
make ingest
```

## Output

```
data/ingest/pipeline/<sha256>/
  context.json         # Pipeline state with output pointer
  target.pdf           # Original file
  target.html          # Raw HTML from images-to-html
  fragment-001.html    # Individual page fragments
  document-context.json # Extracted semantic context
  annotated.html       # Schema.org annotated
  output.html          # Final pipeline output
```

The `context.json` file contains a `pipeline.output` field pointing to the final
artifact:

```json
{
  "pipeline": {
    "output": "output.html",
    "outputMimeType": "text/html"
  }
}
```

## License

MIT
