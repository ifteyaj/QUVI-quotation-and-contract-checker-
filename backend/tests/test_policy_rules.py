"""Tests for deterministic PR matching and company-rule evaluation."""

from decimal import Decimal

from app.schemas import (
    ExtractedField,
    ExtractedLineItem,
    ExtractedQuotation,
    ExtractionStatus,
    FieldEvidence,
)
from app.verification import build_verification_result


def make_field(status=ExtractionStatus.EXTRACTED, value=None, page_number=1, snippet="evidence"):
    return ExtractedField(
        status=status,
        value=value,
        evidence=[FieldEvidence(page_number=page_number, snippet=snippet)] if snippet else [],
    )


def make_extraction(
    *,
    item_code="A",
    qty=Decimal("12000"),
    price=Decimal("480.00"),
    line_total=None,
    item_unit="metre",
    advance=Decimal("10"),
    payment_days=45,
    delivery=20,
    valid=45,
    penalty_rate=Decimal("0.5"),
    clause_present=True,
    tin="123",
    binv="BIN",
    vat_rate=Decimal("15"),
    vat_shown=True,
    currency="BDT",
    description="Cotton twill fabric, 280 gsm",
    payment_terms_text="10% advance payable with the purchase order. Balance within 45 days of delivery.",
    late_clause_text="Late delivery penalty: 0.5% per week.",
    code_status=ExtractionStatus.EXTRACTED,
):
    if line_total is None:
        line_total = qty * price

    item = ExtractedLineItem()
    item.item_code = make_field(code_status, item_code)
    item.description = make_field(ExtractionStatus.EXTRACTED, description)
    item.quoted_quantity = make_field(ExtractionStatus.EXTRACTED, qty)
    item.quoted_unit = make_field(ExtractionStatus.EXTRACTED, item_unit)
    item.quoted_unit_price = make_field(ExtractionStatus.EXTRACTED, price)
    item.line_total = make_field(ExtractionStatus.EXTRACTED, line_total)
    item.currency = make_field(ExtractionStatus.EXTRACTED, currency)

    extraction = ExtractedQuotation()
    extraction.supplier_name = make_field(ExtractionStatus.EXTRACTED, "Supplier")
    extraction.supplier_tin = make_field(ExtractionStatus.EXTRACTED, tin)
    extraction.supplier_bin = make_field(ExtractionStatus.EXTRACTED, binv)
    extraction.quotation_number = make_field(ExtractionStatus.EXTRACTED, "QT-TEST")
    extraction.quotation_date = make_field(ExtractionStatus.EXTRACTED, "2026-10-21")
    extraction.reference_pr_number = make_field(ExtractionStatus.EXTRACTED, "PR-2026-114")
    extraction.currency = make_field(ExtractionStatus.EXTRACTED, currency)
    extraction.quoted_items = [item]
    extraction.payment_terms = make_field(ExtractionStatus.EXTRACTED, payment_terms_text)
    extraction.advance_percent = make_field(ExtractionStatus.EXTRACTED, advance)
    extraction.payment_days_after_delivery = make_field(ExtractionStatus.EXTRACTED, payment_days)
    extraction.delivery_period = make_field(ExtractionStatus.EXTRACTED, f"Delivery within {delivery} days of PO.")
    extraction.delivery_days = make_field(ExtractionStatus.EXTRACTED, delivery)
    extraction.vat_rate_percent = make_field(ExtractionStatus.EXTRACTED, vat_rate)
    extraction.vat_separately_shown = make_field(ExtractionStatus.EXTRACTED, vat_shown)
    extraction.quotation_validity_days = make_field(ExtractionStatus.EXTRACTED, valid)
    extraction.late_penalty_clause_present = make_field(ExtractionStatus.EXTRACTED, clause_present)
    extraction.late_penalty_rate_per_week_percent = make_field(
        ExtractionStatus.EXTRACTED, penalty_rate
    )

    return extraction


def rule_ids(result):
    return {f.rule_id for f in result.decision and result.findings or []}


def test_price_exact_boundary_reviews() -> None:
    # Exact +3% is review, not reject.
    result = build_verification_result(
        make_extraction(price=Decimal("494.40")), "PR-2026-114"
    )
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "NEEDS_HUMAN_REVIEW"
    assert "PRICE_ABOVE_3_PERCENT_REJECT" not in ids
    assert "PRICE_ABOVE_MAX_REVIEW_BAND" in ids


def test_price_above_threshold_rejects() -> None:
    result = build_verification_result(
        make_extraction(price=Decimal("494.41")), "PR-2026-114"
    )
    assert result.decision.decision == "REJECT"
    assert "PRICE_ABOVE_3_PERCENT_REJECT" in {f.rule_id for f in result.findings}


def test_price_at_max_passes_price_check() -> None:
    result = build_verification_result(
        make_extraction(price=Decimal("480.00")), "PR-2026-114"
    )
    ids = {f.rule_id for f in result.findings}
    assert "PRICE_ABOVE_3_PERCENT_REJECT" not in ids
    assert "PRICE_ABOVE_MAX_REVIEW_BAND" not in ids


def test_advance_at_and_above_20() -> None:
    at = build_verification_result(make_extraction(advance=Decimal("20")), "PR-2026-114")
    above = build_verification_result(make_extraction(advance=Decimal("21")), "PR-2026-114")
    assert "ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT" not in {f.rule_id for f in at.findings}
    assert "ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT" in {f.rule_id for f in above.findings}
    assert above.decision.decision == "REJECT"


def test_missing_tin_bin_rejects() -> None:
    extraction = make_extraction(tin=None, binv=None)
    extraction.supplier_tin.status = ExtractionStatus.MISSING
    extraction.supplier_tin.value = None
    extraction.supplier_bin.status = ExtractionStatus.MISSING
    extraction.supplier_bin.value = None
    result = build_verification_result(extraction, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "REJECT"
    assert "SUPPLIER_TIN_MISSING_REJECT" in ids
    assert "SUPPLIER_BIN_MISSING_REJECT" in ids


def test_unclear_tin_bin_reviews() -> None:
    extraction = make_extraction(tin=None, binv=None)
    extraction.supplier_tin.status = ExtractionStatus.UNCLEAR
    extraction.supplier_bin.status = ExtractionStatus.UNCLEAR
    result = build_verification_result(extraction, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "NEEDS_HUMAN_REVIEW"
    assert "SUPPLIER_TIN_UNCLEAR_REVIEW" in ids
    assert "SUPPLIER_BIN_UNCLEAR_REVIEW" in ids


def test_missing_penalty_clause_rejects() -> None:
    extraction = make_extraction(clause_present=False, penalty_rate=None)
    extraction.late_penalty_rate_per_week_percent = make_field(ExtractionStatus.MISSING, None)
    result = build_verification_result(extraction, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "REJECT"
    assert "LATE_PENALTY_MISSING_REJECT" in ids


def test_penalty_rate_below_minimum_reviews() -> None:
    result = build_verification_result(
        make_extraction(penalty_rate=Decimal("0.4")), "PR-2026-114"
    )
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "NEEDS_HUMAN_REVIEW"
    assert "LATE_PENALTY_RATE_BELOW_MINIMUM_REVIEW" in ids


def test_delivery_boundaries() -> None:
    days_and_expected = ((30, "APPROVE"), (31, "NEEDS_HUMAN_REVIEW"), (45, "NEEDS_HUMAN_REVIEW"), (46, "REJECT"))
    for days, expected in days_and_expected:
        result = build_verification_result(make_extraction(delivery=days), "PR-2026-114")
        assert result.decision.decision == expected, days


def test_week_delivery_is_converted_before_policy() -> None:
    extraction = make_extraction(delivery=28)
    extraction.delivery_days.status = ExtractionStatus.EXTRACTED
    extraction.delivery_days.value = 28
    extraction.delivery_period = make_field(ExtractionStatus.EXTRACTED, "Delivery within 4 weeks of PO.")
    result = build_verification_result(extraction, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "APPROVE"
    assert "DELIVERY_DAYS_UNCLEAR_REVIEW" not in ids
    assert "DELIVERY_31_TO_45_DAYS_REVIEW" not in ids


def test_unclear_delivery_still_reviews() -> None:
    extraction = make_extraction(delivery=28)
    extraction.delivery_days.status = ExtractionStatus.UNCLEAR
    extraction.delivery_days.value = None
    extraction.delivery_period = make_field(ExtractionStatus.EXTRACTED, "Delivery as agreed.")
    result = build_verification_result(extraction, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert result.decision.decision == "NEEDS_HUMAN_REVIEW"
    assert "DELIVERY_DAYS_UNCLEAR_REVIEW" in ids


def test_payment_boundaries_and_ambiguous_range() -> None:
    for days in (30, 60):
        result = build_verification_result(make_extraction(payment_days=days), "PR-2026-114")
        ids = {f.rule_id for f in result.findings}
        assert "PAYMENT_DAYS_OUTSIDE_RANGE_REVIEW" not in ids, days
    for days in (29, 61):
        result = build_verification_result(make_extraction(payment_days=days), "PR-2026-114")
        assert "PAYMENT_DAYS_OUTSIDE_RANGE_REVIEW" in {f.rule_id for f in result.findings}, days

    ambiguous = make_extraction(
        payment_days=None,
        payment_terms_text="Payment within 30 to 90 days as agreed.",
    )
    ambiguous.payment_days_after_delivery = make_field(ExtractionStatus.UNCLEAR, None, snippet="30 to 90 days")
    result = build_verification_result(ambiguous, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert "PAYMENT_DAYS_UNCLEAR_REVIEW" in ids


def test_vat_and_arithmetic() -> None:
    bad_vat = make_extraction(vat_shown=False)
    result = build_verification_result(bad_vat, "PR-2026-114")
    assert "VAT_NOT_SEPARATELY_SHOWN_AT_15_REVIEW" in {f.rule_id for f in result.findings}

    missing_vat = make_extraction(vat_rate=None, vat_shown=None)
    missing_vat.vat_rate_percent.status = ExtractionStatus.MISSING
    missing_vat.vat_separately_shown.status = ExtractionStatus.MISSING
    result = build_verification_result(missing_vat, "PR-2026-114")
    assert "VAT_UNCLEAR_REVIEW" in {f.rule_id for f in result.findings}

    mismatch = make_extraction(line_total=Decimal("100.00"))
    result = build_verification_result(mismatch, "PR-2026-114")
    ids = {f.rule_id for f in result.findings}
    assert "LINE_TOTAL_MISMATCH_REVIEW" in ids
    mismatch_finding = next(f for f in result.findings if f.rule_id == "LINE_TOTAL_MISMATCH_REVIEW")
    assert mismatch_finding.page_number == 1


def test_validity_and_quantity() -> None:
    for validity in (30, 29):
        result = build_verification_result(
            make_extraction(valid=validity, qty=Decimal("12601")), "PR-2026-114"
        )
        if validity < 30:
            assert "VALIDITY_BELOW_30_DAYS_REVIEW" in {f.rule_id for f in result.findings}

    boundary_qty = make_extraction(qty=Decimal("12600"))
    result = build_verification_result(boundary_qty, "PR-2026-114")
    assert "QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW" not in {f.rule_id for f in result.findings}

    over_qty = make_extraction(qty=Decimal("12601"))
    result = build_verification_result(over_qty, "PR-2026-114")
    assert "QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW" in {f.rule_id for f in result.findings}


def test_missing_quotation_item_reviews() -> None:
    result = build_verification_result(
        make_extraction(item_code=None, price=None, qty=None, line_total=Decimal("0.00")), "PR-2026-114"
    )
    # Item code missing means it is extracted field status missing; make it unclear manually in one case.
    ids = {f.rule_id for f in result.findings}
    assert "NO_QUOTED_ITEMS_MISSING_REVIEW" not in ids
    assert "PRICE_NOT_EVALUABLE_REVIEW" in ids
    assert "QUANTITY_NOT_EVALUABLE_REVIEW" in ids
    assert "LINE_TOTAL_NOT_EVALUABLE_REVIEW" in ids


def test_unclear_field_does_not_become_confirmed_violation() -> None:
    extraction = make_extraction(price=Decimal("480.00"))
    extraction.quoted_items[0].quoted_unit_price.status = ExtractionStatus.UNCLEAR
    result = build_verification_result(extraction, "PR-2026-114")
    price_findings = [f for f in result.findings if "price" in f.rule_id.lower() or "PRICE" in f.rule_id]
    assert all(not f.confirmed for f in price_findings)
    assert result.decision.decision in {"NEEDS_HUMAN_REVIEW", "APPROVE"}


def test_precedence_and_decisions() -> None:
    # Approve when all applicable checks pass.
    result = build_verification_result(make_extraction(), "PR-2026-114")
    assert result.decision.decision == "APPROVE"

    # Reject precedence over review.
    result = build_verification_result(
        make_extraction(price=Decimal("494.41"), qty=Decimal("13000")), "PR-2026-114"
    )
    assert result.decision.decision == "REJECT"
    assert any(f.rule_id == "PRICE_ABOVE_3_PERCENT_REJECT" for f in result.findings)
    assert any(f.rule_id == "QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW" for f in result.findings)


def test_match_exact_and_unmapped() -> None:
    extraction = make_extraction(item_code=None, description="Cotton twill fabric, 280 gsm")
    result = build_verification_result(extraction, "PR-2026-114")
    assert result.match_results[0].match_status == "MATCHED"
    assert result.match_results[0].match_method == "DESCRIPTION_AND_UNIT"

    unmatched = make_extraction(item_code=None, description="Unknown part", item_unit="unit")
    result = build_verification_result(unmatched, "PR-2026-114")
    assert result.match_results[0].match_status == "UNMATCHED"

    fuzzy = make_extraction(item_code=None, description="Cotton twill fabric 280 gsm")
    result = build_verification_result(fuzzy, "PR-2026-114")
    assert result.match_results[0].match_status == "AMBIGUOUS"


def test_multiple_quoted_items() -> None:
    extraction = make_extraction()
    extra_item = ExtractedLineItem()
    extra_item.item_code = make_field(ExtractionStatus.EXTRACTED, "B")
    extra_item.description = make_field(ExtractionStatus.EXTRACTED, "Metal zipper, 18 cm")
    extra_item.quoted_quantity = make_field(ExtractionStatus.EXTRACTED, 20000)
    extra_item.quoted_unit = make_field(ExtractionStatus.EXTRACTED, "piece")
    extra_item.quoted_unit_price = make_field(ExtractionStatus.EXTRACTED, 40.00)
    extra_item.line_total = make_field(ExtractionStatus.EXTRACTED, 800000)
    extra_item.currency = make_field(ExtractionStatus.EXTRACTED, "BDT")
    extraction.quoted_items.append(extra_item)
    result = build_verification_result(extraction, "PR-2026-114")
    assert len(result.match_results) == 2
    assert result.match_results[1].matched_pr_item_code == "B"
    assert "PRICE_ABOVE_3_PERCENT_REJECT" in {f.rule_id for f in result.findings}
