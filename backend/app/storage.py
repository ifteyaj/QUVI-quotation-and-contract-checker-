import hashlib
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.config import MAX_UPLOAD_SIZE_BYTES, PDF_MAGIC_NUMBER, UPLOAD_DIR


async def read_and_validate_pdf(upload: UploadFile) -> tuple[bytes, str, str]:
    """Read an upload, validate it as a PDF, and return bytes, filename, type."""
    original_filename = upload.filename or "unnamed.pdf"
    content_type = upload.content_type or "application/octet-stream"

    try:
        raw = await upload.read(MAX_UPLOAD_SIZE_BYTES + 1)
    finally:
        await upload.close()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMPTY_FILE",
                "message": "The selected file is empty.",
            },
        )

    if len(raw) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": "The PDF must be 25 MB or smaller.",
            },
        )

    if not raw.startswith(PDF_MAGIC_NUMBER):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_FILE_TYPE",
                "message": "Only valid PDF files are accepted.",
            },
        )

    return raw, original_filename, content_type


def store_pdf(batch_id: str, raw: bytes) -> tuple[str, Path]:
    directory = UPLOAD_DIR / batch_id
    directory.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    destination = directory / stored_filename
    destination.write_bytes(raw)
    return stored_filename, destination


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()
