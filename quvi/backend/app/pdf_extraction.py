from dataclasses import dataclass
from typing import List

import fitz

from app.config import MAX_PDF_PAGES, OCR_TEXT_THRESHOLD_CHARS


class PDFExtractionError(Exception):
    """Raised when a supplied file cannot be opened or parsed as a PDF."""


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str


@dataclass(frozen=True)
class ExtractedPDF:
    page_count: int
    text_char_count: int
    extraction_method: str
    needs_ocr: bool
    pages: List[ExtractedPage]
    text: str


def extract_pdf_text(raw: bytes, max_pages: int = MAX_PDF_PAGES) -> ExtractedPDF:
    """Extract page-level text with PyMuPDF.

    This is a technical extraction step. It does not parse business fields or make
    a supplier quotation decision.
    """
    if not raw:
        raise PDFExtractionError("The PDF file is empty.")

    if not raw.startswith(b"%PDF"):
        raise PDFExtractionError("The file is not a valid PDF.")

    try:
        document = fitz.open(stream=raw, filetype="pdf")
    except Exception as exc:  # PyMuPDF raises several concrete exceptions here.
        raise PDFExtractionError("The PDF could not be opened or parsed.") from exc

    try:
        page_count = document.page_count

        if page_count < 1:
            raise PDFExtractionError("The PDF has no pages.")

        if page_count > max_pages:
            raise PDFExtractionError(f"The PDF exceeds the {max_pages}-page limit.")

        pages: List[ExtractedPage] = []
        for page_index in range(page_count):
            page = document[page_index]
            page_text = (page.get_text("text") or "").strip()
            pages.append(ExtractedPage(page_number=page_index + 1, text=page_text))

        combined_text = "\n\n".join(
            f"Page {page.page_number}\n{page.text}" for page in pages
        ).strip()
        character_count = len(combined_text)
        needs_ocr = character_count < OCR_TEXT_THRESHOLD_CHARS

        return ExtractedPDF(
            page_count=page_count,
            text_char_count=character_count,
            extraction_method="pymupdf",
            needs_ocr=needs_ocr,
            pages=pages,
            text=combined_text,
        )
    finally:
        document.close()
