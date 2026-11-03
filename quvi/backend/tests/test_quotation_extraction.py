"""Unit tests for structured quotation extraction."""

from decimal import Decimal

from app.pdf_extraction import ExtractedPage
from app.quotation_extraction import extract_quotation_from_pages


def _page(text: str):
    return ExtractedPage(page_number=1, text=text)


def test_extracts_supplier_and_terms() -> None:
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

Subtotal
7.00
VAT 15%
1.05
Total
8.05

Supplier TIN: 111222333444 BIN: BIN-111444
TERMS AND CONDITIONS
1. Payment. 10% advance payable with the purchase order. Balance within 40 days of delivery.
2. Delivery. Delivery within 30 days of PO.
3. Delay. Late delivery penalty: 0.5% of order value per week.
4. Validity. This quotation is valid for 45 days from the date above.
"""
    result = extract_quotation_from_pages([_page(text)])

    assert result.supplier_name.status == "EXTRACTED"
    assert result.supplier_name.value == "Acme Tools Ltd"
    assert result.supplier_tin.value == "111222333444"
    assert result.supplier_bin.value == "BIN-111444"
    assert result.quotation_number.value == "QT-123"
    assert result.quotation_date.value == "2026-01-02"
    assert result.reference_pr_number.value == "PR-2026-114"
    assert result.currency.status == "MISSING"
    assert result.payment_terms.status == "EXTRACTED"
    assert result.advance_percent.value == Decimal("10")
    assert result.payment_days_after_delivery.value == 40
    assert result.delivery_period.value is not None
    assert result.delivery_days.value == 30
    assert result.vat_rate_percent.value == Decimal("15")
    assert result.vat_separately_shown.value is True
    assert result.quotation_validity_days.value == 45
    assert result.late_penalty_clause_present.value is True
    assert result.late_penalty_rate_per_week_percent.value == Decimal("0.5")

    assert len(result.quoted_items) == 1
    item = result.quoted_items[0]
    assert item.item_code.value == "A"
    assert item.description.value == "Widget"
    assert item.quoted_quantity.value == Decimal("2")
    assert item.quoted_unit.value == "piece"
    assert item.quoted_unit_price.value == Decimal("3.50")
    assert item.line_total.value == Decimal("7.00")

    for field in (result.supplier_name, result.quotation_number, item.description):
        assert field.evidence
        assert field.evidence[0].page_number == 1
        assert field.evidence[0].snippet


def test_missing_fields_remain_missing_without_inventing_values() -> None:
    text = """Example Supplier
QUOTATION

Random text with no quotation fields or terms.
"""
    result = extract_quotation_from_pages([_page(text)])

    assert result.supplier_name.status == "EXTRACTED"
    assert result.supplier_name.value == "Example Supplier"
    assert result.quotation_number.status == "MISSING"
    assert result.quotation_number.value is None
    assert result.supplier_tin.status == "MISSING"
    assert result.quoted_items == []
    assert any("No quoted line item" in note for note in result.extraction_notes)


def test_multiple_quotation_numbers_are_unclear() -> None:
    text = """Acme Tools Ltd
QUOTATION
Quotation no. QT-1
Quotation no. QT-2
Date 2026-01-02
"""
    result = extract_quotation_from_pages([_page(text)])

    assert result.quotation_number.status == "UNCLEAR"
    assert result.quotation_number.value is None
    assert result.quotation_number.evidence


def test_multiple_quoted_items_are_extracted() -> None:
    text = """Supplier Ltd
QUOTATION
Quotation no. Q-99
Date
2026-02-03
Reference
PR-2026-114

A
First Item
1,000
piece
10.00
10,000.00

B
Second Item
2,000
piece
5.50
11,000.00

Subtotal
21,000.00
VAT 15%
3,150.00
Total
24,150.00
Supplier TIN: 1
Supplier BIN: B1
"""
    result = extract_quotation_from_pages([_page(text)])

    assert len(result.quoted_items) == 2
    assert result.quoted_items[0].item_code.value == "A"
    assert result.quoted_items[0].quoted_quantity.value == Decimal("1000")
    assert result.quoted_items[1].item_code.value == "B"
    assert result.quoted_items[1].quoted_quantity.value == Decimal("2000")
    assert result.quoted_items[1].quoted_unit_price.value == Decimal("5.50")
