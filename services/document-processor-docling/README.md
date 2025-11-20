# Document Processor - Docling Service

Document processing service built with
[Docling](https://github.com/DS4SD/docling) that converts various document
formats to clean Markdown.

## Directory Structure

```
copilot-ld/
├── services/
│   └── document-processor-docling/
│       ├── run.py              # Main processing script
│       ├── pyproject.toml      # Python dependencies
│       ├── uv.lock            # Dependency lock file
│       └── README.md          # This file
└── examples/
    ├── files/                 # INPUT: Place documents here
    │   ├── housing-report.pdf       # PDF with text, infographs and charts
    │   ├── better-health.pptx       # PPTX with text and infographs
    │   └── ...
    └── knowledge/             # OUTPUT: Markdown files saved here
        ├── housing-report.md        # Converted markdown
        ├── better-health.md         # Converted markdown
        ├── images/                  # Extracted images
        │   ├── housing-report-picture-1.png
        │   ├── housing-report-table-1.png
        │   ├── better-health-picture-1.png
        │   └── ...
        └── ...
```

## Supported File Formats

| Category      | Formats                    |
| ------------- | -------------------------- |
| **Documents** | PDF, DOCX, XLSX, PPTX      |
| **Images**    | PNG, JPEG, TIFF, BMP, WEBP |
| **Markup**    | Markdown, AsciiDoc         |

## Installation

### Prerequisites

- **Python 3.10 or higher**
- **[uv](https://github.com/astral-sh/uv) package manager** (recommended)

### Install uv (if not already installed)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Install Project Dependencies

Navigate to the service directory and install dependencies:

```bash
cd services/document-processor-docling

# Install dependencies with uv
uv sync
```

## Usage

All commands should be run from the `services/document-processor-docling`
directory.

### Basic Usage

The first time you run the service, Docling downloads required ML models. This
is a one-time download; subsequent runs will be much faster.

```bash
# Process a document from examples/files
uv run run.py --file ../../examples/files/housing-report.pdf
uv run run.py --file ../../examples/files/better-health.pptx
```

### Input and Output

- **Input Files**: Place your documents in `../../examples/files/`
- **Output Files**: Markdown will be saved to `../../examples/knowledge/`
- **Images**: Extracted images go to `../../examples/knowledge/images/`

### Custom Output Directory

You can specify a custom output directory:

```bash
uv run run.py --file ../../examples/files/document.pdf --output-dir /path/to/output
```

### Performance Statistics

Use the `--stats` flag to display detailed memory usage and performance metrics:

```bash
uv run run.py --file ../../examples/files/document.pdf --stats
```

This displays:

- Memory usage at each processing stage
- Time taken for each operation
- Peak memory usage
- Total memory increase

## Examples

### Process Different File Types

```bash
# Navigate to service directory first
cd services/document-processor-docling

# Process a PDF with stats
uv run run.py --file ../../examples/files/housing-report.pdf --stats

# Process a Word document
uv run run.py --file ../../examples/files/report.docx

# Process a PowerPoint presentation
uv run run.py --file ../../examples/files/slides.pptx

# Process an Excel file
uv run run.py --file ../../examples/files/data.xlsx

# Process a scanned image with OCR
uv run run.py --file ../../examples/files/scanned_page.png --stats
```

## Output Format

The service generates Markdown files in `../../examples/knowledge/` with:

```
Input:  ../../examples/files/housing-report.pdf
Output: ../../examples/knowledge/housing-report.md
Images: ../../examples/knowledge/images/housing-report-picture-1.png
        ../../examples/knowledge/images/housing-report-table-1.png
```

### Markdown Features

The generated Markdown includes:

- Extracted text with proper formatting
- Tables in Markdown table format
- Code blocks with syntax highlighting hints
- Formulas in LaTeX format (between `$...$` or `$$...$$`)
- Image references: `![picture](images/document_picture_1.png)`
