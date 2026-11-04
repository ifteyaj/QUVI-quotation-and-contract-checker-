import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
ASSESSMENT_DATA_DIR = Path(
    os.environ.get("QUVI_ASSESSMENT_DATA_DIR", str(REPO_ROOT / "docs" / "assessment"))
)

# Keep these limits explicit and conservative for the initial upload slice.
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"application/pdf"}
PDF_MAGIC_NUMBER = b"%PDF"

# Technical extraction limits and quality signal threshold.
MAX_PDF_PAGES = 100
OCR_TEXT_THRESHOLD_CHARS = 50
KNOWN_PURCHASE_REQUEST_IDS = {"PR-2026-114"}
