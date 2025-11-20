#!/usr/bin/env python3
"""
Docling Document Processor
Converts various document formats to Markdown using Docling.
"""

import argparse
import shutil
import sys
import time
from pathlib import Path

from docling.datamodel import vlm_model_specs
import psutil

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    EasyOcrOptions,
    PdfPipelineOptions,
    TableFormerMode,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.types.doc import ImageRefMode, PictureItem, TableItem

vlm_model_specs.SMOLDOCLING_MLX,

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".xlsx",
    ".pptx",
}


def setup_converter():
    """
    Configure and return a DocumentConverter with advanced features enabled.

    Enabled features:
    - OCR with EasyOCR for scanned documents
    - Table structure extraction
    - Formula/equation detection
    - Code block detection
    - Image classification
    - Image extraction at 2x resolution (144 DPI)
    """
    # Configure PDF pipeline options
    pipeline_options = PdfPipelineOptions()

    # Enable OCR for scanned documents
    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = EasyOcrOptions(
        force_full_page_ocr=False,  # Only OCR pages without text
        lang=["en"],  # Add more languages as needed: ["en", "fr", "de", ...]
    )

    # Enable table structure extraction
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.table_structure_options.mode = TableFormerMode.FAST
    # pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

    # Enable code block detection and enrichment
    pipeline_options.do_code_enrichment = True

    # Enable formula/equation detection and enrichment
    pipeline_options.do_formula_enrichment = True

    # Enable image classification
    pipeline_options.do_picture_classification = True

    # Enable image generation for pictures and tables
    pipeline_options.images_scale = 2.0  # 2x resolution (144 DPI)
    pipeline_options.generate_picture_images = True

    # Create converter with PDF configuration
    # Other formats (DOCX, XLSX, etc.) will use default settings
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    return converter


def format_bytes(bytes_value: int) -> str:
    """Format bytes into human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} TB"


def process_document(file_path: Path, output_dir: Path, show_stats: bool = False):
    """
    Process a document and save it as Markdown.

    Args:
        file_path: Path to the input document
        output_dir: Directory to save the output Markdown file
        show_stats: If True, display memory and performance statistics
    """
    # Validate input file
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    if not file_path.is_file():
        print(f"Error: Not a file: {file_path}")
        sys.exit(1)

    # Check if file extension is supported
    file_ext = file_path.suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        print(f"Warning: File extension '{file_ext}' may not be supported.")
        print(f"Supported extensions: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
        print("Attempting to process anyway...\n")

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create images subdirectory
    images_dir = output_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # Setup output file path
    output_file = output_dir / f"{file_path.stem}.md"

    print(f"Processing: {file_path}")
    print(f"Output will be saved to: {output_file}\n")

    # Initialize performance tracking
    process = psutil.Process()
    start_time = time.time()
    start_memory = process.memory_info().rss
    peak_memory = start_memory

    if show_stats:
        print(f"[Stats] Initial memory: {format_bytes(start_memory)}\n")

    try:
        # Initialize converter
        print("Initializing Docling converter...")
        converter_start = time.time()
        converter = setup_converter()
        converter_time = time.time() - converter_start

        current_memory = process.memory_info().rss
        peak_memory = max(peak_memory, current_memory)

        if show_stats:
            print(f"[Stats] After initialization: {format_bytes(current_memory)} "
                  f"(+{format_bytes(current_memory - start_memory)}, "
                  f"took {converter_time:.2f}s)\n")

        # Convert document
        print("Converting document (this may take a while for large files)...")
        convert_start = time.time()
        result = converter.convert(str(file_path), raises_on_error=False)
        convert_time = time.time() - convert_start

        current_memory = process.memory_info().rss
        peak_memory = max(peak_memory, current_memory)

        if show_stats:
            print(f"[Stats] After conversion: {format_bytes(current_memory)} "
                  f"(+{format_bytes(current_memory - start_memory)}, "
                  f"took {convert_time:.2f}s)\n")

        # Check conversion status
        if result.status.name != "SUCCESS":
            print(f"\n✗ Conversion failed with status: {result.status.name}")

            # Provide helpful troubleshooting tips
            print("\nPossible issues:")
            print("  - PDF may have missing or invalid page dimensions")
            print("  - File may be corrupted or use unsupported PDF features")
            print("  - Some pages may have been skipped due to errors")

            # Check if we got any partial results
            if hasattr(result, 'document') and result.document and hasattr(result.document, 'pages'):
                page_count = len(result.document.pages)
                if page_count > 0:
                    print(f"\nNote: Partial conversion succeeded for {page_count} page(s).")
                    print("Attempting to export available content...")
                else:
                    print("\nNo pages could be extracted from this document.")
                    sys.exit(1)
            else:
                print("\nNo content could be extracted from this document.")
                sys.exit(1)

        # Export to Markdown and extract images
        print("Exporting to Markdown and extracting images...")
        export_start = time.time()

        # Extract and save images (pictures and tables)
        # Track image references in order they appear
        image_count = 0
        table_count = 0
        picture_count = 0
        image_references = []  # List of (type, filename) tuples in order

        for element, _level in result.document.iterate_items():
            if isinstance(element, TableItem):
                table_count += 1
                image = element.get_image(result.document)
                if image is not None:
                    image_filename = f"{file_path.stem}-table-{table_count}.png"
                    image_path = images_dir / image_filename
                    with image_path.open("wb") as fp:
                        image.save(fp, "PNG")
                    print(f"  Saved table image: {image_filename}")
                    image_references.append(("table", image_filename))
                    image_count += 1
                else:
                    print(f"  Warning: Skipping table {table_count} - no image available")

            elif isinstance(element, PictureItem):
                picture_count += 1
                image = element.get_image(result.document)
                if image is not None:
                    image_filename = f"{file_path.stem}-picture-{picture_count}.png"
                    image_path = images_dir / image_filename
                    with image_path.open("wb") as fp:
                        image.save(fp, "PNG")
                    print(f"  Saved picture: {image_filename}")
                    image_references.append(("picture", image_filename))
                    image_count += 1
                else:
                    print(f"  Warning: Skipping picture {picture_count} - no image available")

        # Export markdown with placeholder that we'll replace
        markdown_content = result.document.export_to_markdown(
            image_mode=ImageRefMode.PLACEHOLDER,
            image_placeholder="__IMAGE_PLACEHOLDER__"
        )

        # Replace placeholders with actual image references
        for img_type, img_filename in image_references:
            # Replace first occurrence with specific reference
            markdown_content = markdown_content.replace(
                "__IMAGE_PLACEHOLDER__",
                f"![{img_type}](images/{img_filename})",
                1  # Replace only the first occurrence
            )

        print(f"\n  Replaced {len(image_references)} image placeholders with references")

        export_time = time.time() - export_start

        current_memory = process.memory_info().rss
        peak_memory = max(peak_memory, current_memory)

        if show_stats:
            print(f"[Stats] After export: {format_bytes(current_memory)} "
                  f"(took {export_time:.2f}s)\n")

        # Save markdown to file
        print(f"Saving to {output_file}...")
        with output_file.open("w", encoding="utf-8") as f:
            f.write(markdown_content)

        total_time = time.time() - start_time
        final_memory = process.memory_info().rss
        memory_increase = final_memory - start_memory

        print(f"\n✓ Success! Document processed and saved to: {output_file}")
        print(f"  Pages processed: {len(result.document.pages)}")
        print(f"  Images extracted: {image_count}")
        print(f"  Output size: {output_file.stat().st_size:,} bytes")

        if show_stats:
            print(f"\n{'='*60}")
            print("Performance Statistics:")
            print(f"{'='*60}")
            print(f"  Total time:          {total_time:.2f}s")
            print(f"    - Initialization:  {converter_time:.2f}s")
            print(f"    - Conversion:      {convert_time:.2f}s")
            print(f"    - Export:          {export_time:.2f}s")
            print("\n  Memory usage:")
            print(f"    - Initial:         {format_bytes(start_memory)}")
            print(f"    - Final:           {format_bytes(final_memory)}")
            print(f"    - Peak:            {format_bytes(peak_memory)}")
            print(f"    - Increase:        {format_bytes(memory_increase)}")
            print(f"{'='*60}")

    except Exception as e:
        print(f"\n✗ Error processing document: {e}")
        sys.exit(1)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Convert documents to Markdown using Docling",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Supported file formats:
  Documents: PDF, DOCX, XLSX, PPTX
  Images:    PNG, JPEG, TIFF, BMP, WEBP
  Web:       HTML, XHTML
  Markup:    Markdown, AsciiDoc
  Data:      CSV
  Special:   WebVTT, XML (USPTO, JATS), JSON

Examples:
  python run.py --file ../../examples/files/document.pdf
  python run.py --file ../../examples/files/presentation.pptx --stats
  uv run run.py --file ../../examples/files/image.png --stats
        """,
    )

    parser.add_argument(
        "--file",
        type=str,
        required=True,
        help="Path to the document to process",
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default="../../examples/knowledge",
        help="Directory to save output files (default: ../../examples/knowledge)",
    )

    parser.add_argument(
        "--stats",
        action="store_true",
        help="Display memory usage and performance statistics",
    )

    args = parser.parse_args()

    # Convert paths
    file_path = Path(args.file).resolve()
    output_dir = Path(args.output_dir).resolve()

    # Process the document
    process_document(file_path, output_dir, show_stats=args.stats)


if __name__ == "__main__":
    main()
