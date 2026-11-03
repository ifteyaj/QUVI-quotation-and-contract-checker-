import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import KNOWN_PURCHASE_REQUEST_IDS, MAX_PDF_PAGES
from app.pdf_extraction import PDFExtractionError, ExtractedPage, extract_pdf_text
from app.quotation_extraction import extract_quotation_from_pages
from app.verification import build_verification_result
from app.schemas import BatchUploadResponse, DocumentUploadResult, ExtractedPageResult, RejectedFileResult
from app.storage import read_and_validate_pdf, sha256_bytes, store_pdf

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.post("", response_model=BatchUploadResponse, status_code=201)
async def create_batch(
    files: List[UploadFile] = File(..., description="One or more supplier quotation PDFs"),
    purchase_request_id: Optional[str] = Form(default=None),
) -> BatchUploadResponse:
    """Validate, store, and extract text from uploaded supplier quotation PDFs.

    This endpoint performs intake and technical text extraction only. It does not
    parse business fields or make a quotation decision.
    """
    if purchase_request_id is not None and purchase_request_id not in KNOWN_PURCHASE_REQUEST_IDS:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "UNKNOWN_PURCHASE_REQUEST",
                "message": "The selected purchase request is not available.",
            },
        )

    batch_id = f"bat_{uuid.uuid4().hex}"
    created_at = datetime.now(timezone.utc)

    accepted_documents: list[DocumentUploadResult] = []
    rejected_files: list[RejectedFileResult] = []

    for upload in files:
        original_filename = upload.filename or "unnamed.pdf"

        try:
            raw, validated_filename, content_type = await read_and_validate_pdf(upload)
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, dict) else {}
            rejected_files.append(
                RejectedFileResult(
                    filename=original_filename,
                    error_code=str(detail.get("code", "INVALID_FILE")),
                    message=str(detail.get("message", "The file could not be accepted.")),
                )
            )
            continue

        try:
            extracted = extract_pdf_text(raw, max_pages=MAX_PDF_PAGES)
        except PDFExtractionError as exc:
            rejected_files.append(
                RejectedFileResult(
                    filename=validated_filename,
                    error_code="PDF_TEXT_EXTRACTION_FAILED",
                    message=str(exc),
                )
            )
            continue

        stored_filename, _destination = store_pdf(batch_id, raw)
        processing_status = (
            "TEXT_EXTRACTED" if extracted.text_char_count > 0 else "OCR_REQUIRED"
        )

        quotation_extraction = extract_quotation_from_pages(extracted.pages)
        verification_result = build_verification_result(
            quotation_extraction, purchase_request_id
        )

        accepted_documents.append(
            DocumentUploadResult(
                document_id=f"doc_{uuid.uuid4().hex}",
                original_filename=validated_filename,
                stored_filename=stored_filename,
                content_type=content_type,
                size_bytes=len(raw),
                sha256=sha256_bytes(raw),
                processing_status=processing_status,
                page_count=extracted.page_count,
                text_char_count=extracted.text_char_count,
                extraction_method=extracted.extraction_method,
                needs_ocr=extracted.needs_ocr,
                pages=[
                    ExtractedPageResult(page_number=page.page_number, text=page.text)
                    for page in extracted.pages
                ],
                extracted_text=extracted.text,
                quotation_extraction=quotation_extraction,
                verification_result=verification_result,
                created_at=created_at,
            )
        )

    if not accepted_documents:
        first_error = rejected_files[0] if rejected_files else None
        raise HTTPException(
            status_code=400,
            detail={
                "code": first_error.error_code if first_error else "NO_VALID_FILES",
                "message": first_error.message if first_error else "No valid PDF files were provided.",
            },
        )

    return BatchUploadResponse(
        batch_id=batch_id,
        purchase_request_id=purchase_request_id,
        created_at=created_at,
        documents=accepted_documents,
        rejected_files=rejected_files,
    )
