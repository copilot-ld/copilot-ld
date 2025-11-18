# Changelog

## 2025-11-18

- Bump version

## 2025-10-29

- Fixed Mermaid diagram rendering by preventing HTML entity escaping in code
  blocks
- Added post-processing step in `DocsBuilder` to `unescape` HTML entities
  (`&gt;`, `&lt;`, etc.) in Mermaid code blocks after Prettier formatting
- Updated Mermaid.js initialization in `main.js` to use `nodes` option with
  `.language-mermaid` selector
- Fixed Mermaid configuration to use `startOnLoad: false` and explicit
  `mermaid.run()` call with node selector
- Mermaid.js now correctly parses and renders sequence diagram arrows (`->`,
  `-->>`, etc.)

## 2025-10-20

- Updated automated tests to match current `DocsBuilder` and `DocsServer`
  implementations
- Fixed test mocks to include required `prettier` dependency
- Updated `DocsServer` tests to reflect optional `HonoConstructor` and `serveFn`
  parameters
- Fixed template filename in test mocks from `template.mustache` to
  `template.html.mustache`
- Added `prettier` dependency for HTML formatting
- Enhanced `DocsBuilder` to format generated HTML files using Prettier
- Updated constructor to inject `prettier` dependency
- Updated `build.js` and `serve.js` to provide Prettier instance
- Initial release of `@copilot-ld/libdoc` package
- Added `DocsBuilder` class for converting Markdown files to HTML
- Added `DocsServer` class for serving and watching documentation
- Added `docs-build` binary for building documentation
- Added `docs-serve` binary for serving documentation with optional watch mode
- Support for Mustache templates, Markdown with gray-matter front matter
- Support for Mermaid diagrams and automatic table of contents generation
- Support for static asset copying (CSS, JS, images)
