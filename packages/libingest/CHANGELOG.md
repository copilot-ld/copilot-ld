# Changelog

## 2025-12-01

- Initial release of `@copilot-ld/libingest` package
- Scans ingest in folder for files
- Moves each file to a new folder named by its SHA-256 hash
- Writes `context.json` with file name, extension, and mime type and ingest
  steps
