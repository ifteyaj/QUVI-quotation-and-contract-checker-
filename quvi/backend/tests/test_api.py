"""HTTP-level tests for the QUVI intake and extraction workflow."""

import fitz
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def make_pdf(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    y = 72
    for line in text.splitlines():
        page.insert_text((72, y), line)
        y += 14
    data = document.tobytes()
    document.close()
    return data


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "QUVI"}


def test_purchase_request_lookup_and_unknown() -> None:
    response = client.get("/api/purchase-requests/PR-2026-114")
    assert response.status_code == 200
    body = response.json()
    assert body["pr_number"] == "PR-2026-114"
    assert len(body["items"]) == 5
    assert body["items"][0]["item_code"] == "A"
    assert body["items"][0]["requested_quantity"] == "12000"
    assert body["items"][0]["maximum_unit_price"] == "480.00"

    unknown = client.get("/api/purchase-requests/PR-9999")
    assert unknown.status_code == 404
    assert unknown.json()["detail"]["code"] == "PURCHASE_REQUEST_NOT_FOUND"


def test_valid_pdf_upload_and_extraction() -> None:
    text = """Acme Tools Ltd
QUOTATION
Quotation no.
QT-123
Date
2026-01-02
To
Aamar Garments Ltd (fictional)
Reference
PR-2026-114

A
Widget
2
piece
3.50
7.00
"""
    pdf = make_pdf(text)
    response = client.post(
        "/api/batches",
        files=[("files", ("quotation.pdf", pdf, "application/pdf"))],
        data={"purchase_request_id": "PR-2026-114"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["purchase_request_id"] == "PR-2026-114"
    assert len(body["documents"]) == 1
    document = body["documents"][0]
    assert document["processing_status"] == "TEXT_EXTRACTED"
    assert document["page_count"] == 1
    assert document["text_char_count"] > 0
    assert "Acme Tools Ltd" in document["extracted_text"]
    assert document["quotation_extraction"]["supplier_name"]["value"] == "Acme Tools Ltd"
    assert document["quotation_extraction"]["quotation_number"]["value"] == "QT-123"


def test_invalid_file_type_is_rejected() -> None:
    response = client.post(
        "/api/batches",
        files=[("files", ("not-a-pdf.txt", b"plain text", "text/plain"))],
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "UNSUPPORTED_FILE_TYPE"
    assert "Only valid PDF" in detail["message"]


def test_missing_file_returns_field_required() -> None:
    response = client.post("/api/batches")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(item.get("type") == "missing" for item in detail)


def test_corrupt_pdf_is_rejected_per_file() -> None:
    response = client.post(
        "/api/batches",
        files=[("files", ("corrupt.pdf", b"%PDF-1.4\nnot valid", "application/pdf"))],
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "PDF_TEXT_EXTRACTION_FAILED"
