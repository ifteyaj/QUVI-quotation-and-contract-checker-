"""Deterministic policy evaluation for QUVI quotations."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Tuple

from app.pr_matching import MatchResult, MatchedQuotationItem, _normalize_text
from app.schemas import (
    BusinessDecision,
    BusinessFinding,
    DecisionResult,
    ExtractedQuotation,
    FindingSeverity,
    FieldEvidence,
)


RULE_SET_VERSION = "aamar-garments-rules-v1"
PRICE_REJECT_RATIO = Decimal("0.03")
QUANTITY_REVIEW_RATIO = Decimal("0.05")
ADVANCE_REJECT_PERCENT = Decimal("20")
DELIVERY_REJECT_DAYS = 45
DELIVERY_REVIEW_MIN_DAYS = 31
PAYMENT_MIN_DAYS = 30
PAYMENT_MAX_DAYS = 60
VAT_REQUIRED_PERCENT = Decimal("15")
VALIDITY_MIN_DAYS = 30
PENALTY_MIN_PERCENT = Decimal("0.5")


def _as_decimal(value: object) -> Optional[Decimal]:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, int):
        return Decimal(value)
    text = str(value).strip().replace(",", "").replace(" ", "")
    if not text:
        return None
    try:
        return Decimal(text)
    except (InvalidOperation, ValueError):
        return None


def _as_int(value: object) -> Optional[int]:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    text = str(value).strip().replace(",", "").replace(" ", "")
    if not text:
        return None
    try:
        return int(text)
    except ValueError:
        return None


def _field_status(field) -> str:
    return getattr(field, "status", "MISSING") if field is not None else "MISSING"


def _field_value(field):
    return getattr(field, "value", None) if field is not None else None


def _field_evidence(field) -> Optional[FieldEvidence]:
    if field is None:
        return None
    evidence = getattr(field, "evidence", None)
    if evidence:
        return evidence[0]
    return None


def _field_text(field) -> str:
    status = _field_status(field)
    value = _field_value(field)
    if value is None:
        return status.lower()
    return str(value)


def _policy_evidence(items: list, fallback_pages) -> Optional[FieldEvidence]:
    if items:
        return items[0]
    # Prefer a purchase-request-related quoted line, then supplier TIN.
    return None


def _add_finding(
    findings: List[BusinessFinding],
    *,
    rule_id: str,
    title: str,
    message: str,
    severity: str,
    confirmed: bool,
    finding_status: str = "TRIGGERED",
    field_path: Optional[str] = None,
    observed_value: object = None,
    expected_value: object = None,
    evidence: Optional[FieldEvidence] = None,
    related_quoted_item_code: Optional[str] = None,
    related_pr_item_code: Optional[str] = None,
) -> None:
    findings.append(
        BusinessFinding(
            finding_id=f"finding_{len(findings) + 1}",
            rule_id=rule_id,
            rule_version=RULE_SET_VERSION,
            severity=severity,
            status=finding_status,
            title=title,
            message=message,
            confirmed=confirmed,
            field_path=field_path,
            observed_value=observed_value,
            expected_value=expected_value,
            page_number=evidence.page_number if evidence else None,
            evidence_text=evidence.snippet if evidence else None,
            related_quoted_item_code=related_quoted_item_code,
            related_pr_item_code=related_pr_item_code,
        )
    )


def evaluate_quotation_rules(
    extraction: ExtractedQuotation,
    match_result: "MatchResult",
):
    findings: List[BusinessFinding] = []

    # Unmatched or ambiguous PR mappings are review conditions.
    for match in match_result.matches:
        if match.match_status == "AMBIGUOUS":
            _add_finding(
                findings,
                rule_id="PR_MATCH_AMBIGUOUS",
                title="Quotation item could not be matched with confidence",
                message=(
                    f"Quotation item {match.quoted_item_code or match.match_id} "
                    "matches more than one plausible purchase-request item or differs in unit."
                ),
                severity="REVIEW",
                confirmed=True,
                field_path=f"quoted_items[{match.quoted_item_index}].item_code",
                observed_value=match.quoted_description,
                expected_value="One unambiguous PR item match",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )
        elif match.match_status == "UNMATCHED":
            _add_finding(
                findings,
                rule_id="PR_ITEM_UNMATCHED",
                title="Quotation item does not map to the PR",
                message=(
                    f"Quotation item {match.quoted_item_code or match.match_id} "
                    "could not be matched to any purchase-request item."
                ),
                severity="REVIEW",
                confirmed=True,
                field_path=f"quoted_items[{match.quoted_item_index}].item_code",
                observed_value=match.quoted_description,
                expected_value="A purchase-request item match",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
            )

    # Missing or unclear supplier TIN.
    tin_field = extraction.supplier_tin
    tin_evidence = _field_evidence(tin_field)
    if _field_status(tin_field) == "MISSING":
        _add_finding(
            findings,
            rule_id="SUPPLIER_TIN_MISSING_REJECT",
            title="Supplier TIN is missing",
            message="The supplier TIN is missing, so the quotation is rejected under the TIN/BIN rule.",
            severity="REJECT",
            confirmed=True,
            field_path="supplier_tin",
            observed_value="missing",
            expected_value="Supplier TIN present",
            evidence=tin_evidence,
        )
    elif _field_status(tin_field) == "UNCLEAR":
        _add_finding(
            findings,
            rule_id="SUPPLIER_TIN_UNCLEAR_REVIEW",
            title="Supplier TIN is unclear",
            message="The supplier TIN could not be interpreted reliably from the quotation.",
            severity="REVIEW",
            confirmed=False,
            field_path="supplier_tin",
            observed_value="unclear",
            expected_value="Supplier TIN present",
            evidence=tin_evidence,
        )

    # Missing or unclear supplier BIN.
    bin_field = extraction.supplier_bin
    bin_evidence = _field_evidence(bin_field)
    if _field_status(bin_field) == "MISSING":
        _add_finding(
            findings,
            rule_id="SUPPLIER_BIN_MISSING_REJECT",
            title="Supplier BIN is missing",
            message="The supplier BIN is missing, so the quotation is rejected under the TIN/BIN rule.",
            severity="REJECT",
            confirmed=True,
            field_path="supplier_bin",
            observed_value="missing",
            expected_value="Supplier BIN present",
            evidence=bin_evidence,
        )
    elif _field_status(bin_field) == "UNCLEAR":
        _add_finding(
            findings,
            rule_id="SUPPLIER_BIN_UNCLEAR_REVIEW",
            title="Supplier BIN is unclear",
            message="The supplier BIN could not be interpreted reliably from the quotation.",
            severity="REVIEW",
            confirmed=False,
            field_path="supplier_bin",
            observed_value="unclear",
            expected_value="Supplier BIN present",
            evidence=bin_evidence,
        )

    # Late-delivery penalty clause.
    clause_field = extraction.late_penalty_clause_present
    clause_evidence = _field_evidence(clause_field)
    clause_present: Optional[bool] = None
    if _field_status(clause_field) == "EXTRACTED":
        clause_present = _field_value(clause_field) is True
    elif _field_status(clause_field) == "MISSING":
        clause_present = False
    else:
        clause_present = None

    if clause_present is False:
        _add_finding(
            findings,
            rule_id="LATE_PENALTY_MISSING_REJECT",
            title="Late-delivery penalty clause is missing",
            message="No late-delivery penalty clause is present, so the quotation is rejected.",
            severity="REJECT",
            confirmed=True,
            field_path="late_penalty_clause_present",
            observed_value="absent",
            expected_value="Late-delivery penalty clause present",
            evidence=clause_evidence,
        )
    elif clause_present is None:
        _add_finding(
            findings,
            rule_id="LATE_PENALTY_UNCLEAR_REVIEW",
            title="Late-delivery penalty clause is unclear",
            message="The presence of a late-delivery penalty clause could not be confirmed.",
            severity="REVIEW",
            confirmed=False,
            field_path="late_penalty_clause_present",
            observed_value="unclear",
            expected_value="Confirmed late-delivery penalty clause",
            evidence=clause_evidence,
        )

    # Late-delivery penalty rate below policy minimum.
    if clause_present is True:
        rate_field = extraction.late_penalty_rate_per_week_percent
        rate_value = _as_decimal(_field_value(rate_field))
        if _field_status(rate_field) in {"MISSING", "UNCLEAR"}:
            _add_finding(
                findings,
                rule_id="LATE_PENALTY_RATE_UNCLEAR_REVIEW",
                title="Late penalty rate is unclear",
                message="A late-delivery penalty clause exists, but its weekly rate could not be confirmed.",
                severity="REVIEW",
                confirmed=False,
                field_path="late_penalty_rate_per_week_percent",
                observed_value=_field_text(rate_field),
                expected_value=f"At least {PENALTY_MIN_PERCENT}% of order value per week",
                evidence=_field_evidence(rate_field) or clause_evidence,
            )
        elif rate_value is None:
            _add_finding(
                findings,
                rule_id="LATE_PENALTY_RATE_UNCLEAR_REVIEW",
                title="Late penalty rate is unclear",
                message="A late-delivery penalty clause exists, but its weekly rate could not be converted reliably.",
                severity="REVIEW",
                confirmed=False,
                field_path="late_penalty_rate_per_week_percent",
                observed_value=_field_text(rate_field),
                expected_value=f"At least {PENALTY_MIN_PERCENT}% of order value per week",
                evidence=_field_evidence(rate_field) or clause_evidence,
            )
        elif rate_value < PENALTY_MIN_PERCENT:
            _add_finding(
                findings,
                rule_id="LATE_PENALTY_RATE_BELOW_MINIMUM_REVIEW",
                title="Late penalty rate is below the required minimum",
                message=(
                    f"The penalty rate is {rate_value}% per week, below the "
                    f"required minimum of {PENALTY_MIN_PERCENT}% per week."
                ),
                severity="REVIEW",
                confirmed=True,
                field_path="late_penalty_rate_per_week_percent",
                observed_value=f"{rate_value}% per week",
                expected_value=f"At least {PENALTY_MIN_PERCENT}% per week",
                evidence=_field_evidence(rate_field) or clause_evidence,
            )

    # Advance payment.
    advance_field = extraction.advance_percent
    advance_value = _as_decimal(_field_value(advance_field))
    if _field_status(advance_field) == "EXTRACTED" and advance_value is not None:
        if advance_value > ADVANCE_REJECT_PERCENT:
            _add_finding(
                findings,
                rule_id="ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT",
                title="Advance payment exceeds the limit",
                message=f"The advance payment is {advance_value}%, above the 20% limit.",
                severity="REJECT",
                confirmed=True,
                field_path="advance_percent",
                observed_value=f"{advance_value}%",
                expected_value="20% or less",
                evidence=_field_evidence(advance_field),
            )
    else:
        _add_finding(
            findings,
            rule_id="ADVANCE_PAYMENT_UNCLEAR_REVIEW",
            title="Advance payment is unclear or missing",
            message="The advance payment percentage could not be confirmed from the payment terms.",
            severity="REVIEW",
            confirmed=False,
            field_path="advance_percent",
            observed_value=_field_text(advance_field),
            expected_value="Maximum 20%",
            evidence=_field_evidence(advance_field) or _field_evidence(extraction.payment_terms),
        )

    # Payment days.
    payment_days_field = extraction.payment_days_after_delivery
    payment_days = _as_int(_field_value(payment_days_field))
    if _field_status(payment_days_field) in {"MISSING", "UNCLEAR"}:
        _add_finding(
            findings,
            rule_id="PAYMENT_DAYS_UNCLEAR_REVIEW",
            title="Payment days are unclear",
            message="Payment terms are unclear or their number of days after delivery could not be evaluated.",
            severity="REVIEW",
            confirmed=False,
            field_path="payment_days_after_delivery",
            observed_value=_field_text(payment_days_field),
            expected_value="30 to 60 days after delivery",
            evidence=_field_evidence(payment_days_field) or _field_evidence(extraction.payment_terms),
        )
    elif payment_days is None:
        _add_finding(
            findings,
            rule_id="PAYMENT_DAYS_UNPARSED_REVIEW",
            title="Payment days are unclear",
            message="Payment terms were present, but the number of payment days could not be converted reliably.",
            severity="REVIEW",
            confirmed=False,
            field_path="payment_days_after_delivery",
            observed_value=_field_text(payment_days_field),
            expected_value="30 to 60 days after delivery",
            evidence=_field_evidence(payment_days_field) or _field_evidence(extraction.payment_terms),
        )
    elif payment_days < PAYMENT_MIN_DAYS or payment_days > PAYMENT_MAX_DAYS:
        _add_finding(
            findings,
            rule_id="PAYMENT_DAYS_OUTSIDE_RANGE_REVIEW",
            title="Payment terms are outside the allowed range",
            message=f"Payment is due after {payment_days} days, outside the 30 to 60 day range.",
            severity="REVIEW",
            confirmed=True,
            field_path="payment_days_after_delivery",
            observed_value=f"{payment_days} days after delivery",
            expected_value="30 to 60 days after delivery",
            evidence=_field_evidence(payment_days_field) or _field_evidence(extraction.payment_terms),
        )

    # Delivery.
    delivery_days_field = extraction.delivery_days
    delivery_days = _as_int(_field_value(delivery_days_field))
    if _field_status(delivery_days_field) in {"MISSING", "UNCLEAR"}:
        _add_finding(
            findings,
            rule_id="DELIVERY_DAYS_UNCLEAR_REVIEW",
            title="Delivery days are unclear",
            message="Delivery is stated in weeks or could not be converted to days after the purchase order.",
            severity="REVIEW",
            confirmed=False,
            field_path="delivery_days",
            observed_value=_field_text(delivery_days_field),
            expected_value="30 days or fewer preferred; more than 45 days rejected",
            evidence=_field_evidence(delivery_days_field) or _field_evidence(extraction.delivery_period),
        )
    elif delivery_days is None:
        _add_finding(
            findings,
            rule_id="DELIVERY_DAYS_UNPARSED_REVIEW",
            title="Delivery days are unclear",
            message="A delivery period was present, but the number of days could not be converted reliably.",
            severity="REVIEW",
            confirmed=False,
            field_path="delivery_days",
            observed_value=_field_text(delivery_days_field),
            expected_value="30 days or fewer preferred; more than 45 days rejected",
            evidence=_field_evidence(delivery_days_field) or _field_evidence(extraction.delivery_period),
        )
    elif delivery_days > DELIVERY_REJECT_DAYS:
        _add_finding(
            findings,
            rule_id="DELIVERY_LATER_THAN_45_DAYS_REJECT",
            title="Delivery is later than 45 days",
            message=f"Delivery is promised in {delivery_days} days, later than the 45-day limit.",
            severity="REJECT",
            confirmed=True,
            field_path="delivery_days",
            observed_value=f"{delivery_days} days after PO",
            expected_value="45 days or fewer",
            evidence=_field_evidence(delivery_days_field) or _field_evidence(extraction.delivery_period),
        )
    elif delivery_days >= DELIVERY_REVIEW_MIN_DAYS:
        _add_finding(
            findings,
            rule_id="DELIVERY_31_TO_45_DAYS_REVIEW",
            title="Delivery is in the 31 to 45 day review range",
            message=f"Delivery is promised in {delivery_days} days, which requires review.",
            severity="REVIEW",
            confirmed=True,
            field_path="delivery_days",
            observed_value=f"{delivery_days} days after PO",
            expected_value="30 days or fewer",
            evidence=_field_evidence(delivery_days_field) or _field_evidence(extraction.delivery_period),
        )

    # VAT.
    vat_rate = _as_decimal(_field_value(extraction.vat_rate_percent))
    vat_shown = _field_value(extraction.vat_separately_shown)
    if _field_status(extraction.vat_rate_percent) == "EXTRACTED" and _field_status(
        extraction.vat_separately_shown
    ) == "EXTRACTED":
        if vat_rate != VAT_REQUIRED_PERCENT or vat_shown is not True:
            _add_finding(
                findings,
                rule_id="VAT_NOT_SEPARATELY_SHOWN_AT_15_REVIEW",
                title="VAT is not shown separately at 15%",
                message=(
                    f"VAT is {'not separately shown at 15%' if vat_shown is not True else 'not at 15%'} "
                    "as required."
                ),
                severity="REVIEW",
                confirmed=True,
                field_path="vat_rate_percent",
                observed_value=f"rate={vat_rate}%, separately shown={vat_shown}",
                expected_value="15% separately shown",
                evidence=_field_evidence(extraction.vat_rate_percent) or _field_evidence(extraction.vat_separately_shown),
            )
    else:
        _add_finding(
            findings,
            rule_id="VAT_UNCLEAR_REVIEW",
            title="VAT presentation is unclear",
            message="VAT was not identified as separately shown at 15%.",
            severity="REVIEW",
            confirmed=False,
            field_path="vat_rate_percent",
            observed_value=_field_text(extraction.vat_rate_percent),
            expected_value="15% separately shown",
            evidence=_field_evidence(extraction.vat_rate_percent) or _field_evidence(extraction.vat_separately_shown),
        )

    # Quotation validity.
    validity_field = extraction.quotation_validity_days
    validity = _as_int(_field_value(validity_field))
    if _field_status(validity_field) in {"MISSING", "UNCLEAR"}:
        _add_finding(
            findings,
            rule_id="VALIDITY_UNCLEAR_REVIEW",
            title="Quotation validity is unclear",
            message="The quotation validity period could not be evaluated.",
            severity="REVIEW",
            confirmed=False,
            field_path="quotation_validity_days",
            observed_value=_field_text(validity_field),
            expected_value=f"At least {VALIDITY_MIN_DAYS} days",
            evidence=_field_evidence(validity_field),
        )
    elif validity is not None and validity < VALIDITY_MIN_DAYS:
        _add_finding(
            findings,
            rule_id="VALIDITY_BELOW_30_DAYS_REVIEW",
            title="Quotation validity is below 30 days",
            message=f"The quotation is valid for {validity} days, less than the required 30 days.",
            severity="REVIEW",
            confirmed=True,
            field_path="quotation_validity_days",
            observed_value=f"{validity} days",
            expected_value="30 days or more",
            evidence=_field_evidence(validity_field),
        )

    # Currency mismatch.
    document_currency_field = extraction.currency
    document_currency_value = _field_value(document_currency_field)
    if _field_status(document_currency_field) == "EXTRACTED" and document_currency_value is not None:
        normalized_currency = str(document_currency_value).strip().upper()
        if normalized_currency != "BDT":
            _add_finding(
                findings,
                rule_id="CURRENCY_MISMATCH_REVIEW",
                title="Quotation currency differs from the purchase request",
                message=f"The quotation currency is {normalized_currency}; the purchase request is in BDT.",
                severity="REVIEW",
                confirmed=True,
                field_path="currency",
                observed_value=normalized_currency,
                expected_value="BDT",
                evidence=_field_evidence(document_currency_field),
            )

    # Matched-item price, quantity, arithmetic, and currency checks.
    matches = list(match_result.matches)
    matched_indexes = [m for m in matches if m.match_status == "MATCHED"]

    if extraction.quoted_items and not matched_indexes:
        _add_finding(
            findings,
            rule_id="NO_QUOTED_ITEM_MATCHED_REVIEW",
            title="No quotation item matched a PR item",
            message="The quotation's item or items could not be matched confidently to the purchase request.",
            severity="REVIEW",
            confirmed=True,
            field_path="quoted_items",
            observed_value=extraction.quoted_items and "one or more unmatched quoted items" or "no quoted items",
            expected_value="A matched purchase-request item",
            evidence=None,
        )
    elif not extraction.quoted_items:
        _add_finding(
            findings,
            rule_id="NO_QUOTED_ITEMS_MISSING_REVIEW",
            title="No quoted item was extracted",
            message="The quotation extraction did not produce a usable line item.",
            severity="REVIEW",
            confirmed=False,
            field_path="quoted_items",
            observed_value="missing",
            expected_value="At least one quoted item",
            evidence=None,
        )

    for match in match_result.matches:
        quoted_index = match.quoted_item_index
        quoted_extraction = (
            extraction.quoted_items[quoted_index] if 0 <= quoted_index < len(extraction.quoted_items) else None
        )

        if match.match_status != "MATCHED":
            continue

        price_field = getattr(quoted_extraction, "quoted_unit_price", None) if quoted_extraction else None
        quantity_field = getattr(quoted_extraction, "quoted_quantity", None) if quoted_extraction else None
        line_total_field = getattr(quoted_extraction, "line_total", None) if quoted_extraction else None
        currency_field = getattr(quoted_extraction, "currency", None) if quoted_extraction else None
        quoted_price = match.quoted_unit_price
        quoted_quantity = match.quoted_quantity
        quoted_line_total = match.quoted_line_total
        pr_max = match.maximum_unit_price
        pr_quantity = match.requested_quantity

        if _field_status(price_field) in {"MISSING", "UNCLEAR"} or quoted_price is None or pr_max is None:
            _add_finding(
                findings,
                rule_id="PRICE_NOT_EVALUABLE_REVIEW",
                    title="Unit price cannot be evaluated",
                    message=f"Unit price for item {match.quoted_item_code} is missing or unclear.",
                    severity="REVIEW",
                    confirmed=False,
                    field_path=f"quoted_items[{quoted_index}].quoted_unit_price",
                    observed_value=_field_text(price_field),
                    expected_value=f"Maximum {pr_max} BDT",
                    evidence=None,
                )
        elif quoted_price > pr_max * (Decimal("1") + PRICE_REJECT_RATIO):
            _add_finding(
                findings,
                rule_id="PRICE_ABOVE_3_PERCENT_REJECT",
                title="Unit price is more than 3% above the maximum",
                message=(
                    f"Quoted unit price {quoted_price} BDT is more than 3% above "
                    f"the PR maximum of {pr_max} BDT."
                ),
                severity="REJECT",
                confirmed=True,
                field_path=f"quoted_items[{quoted_index}].quoted_unit_price",
                observed_value=f"{quoted_price} BDT",
                expected_value=f"4% no; more than 3% above {pr_max} BDT rejects",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )
        elif quoted_price > pr_max:
            ratio = ((quoted_price - pr_max) / pr_max * Decimal("100"))
            percent = ratio.quantize(Decimal("0.01"))
            _add_finding(
                findings,
                rule_id="PRICE_ABOVE_MAX_REVIEW_BAND",
                title="Unit price is above the maximum within the 3% review band",
                message=(
                    f"Quoted unit price {quoted_price} BDT is {percent}% above the "
                    f"PR maximum of {pr_max} BDT."
                ),
                severity="REVIEW",
                confirmed=True,
                field_path=f"quoted_items[{quoted_index}].quoted_unit_price",
                observed_value=f"{quoted_price} BDT",
                expected_value=f"{pr_max} BDT, review up to 3% above",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )

        if match.match_status == "MATCHED" and match.quoted_unit and match.matched_pr_unit:
            if _normalize_text(match.quoted_unit) != _normalize_text(match.matched_pr_unit):
                pass  # already converted to ambiguous during matching

        if _field_status(quantity_field) in {"MISSING", "UNCLEAR"} or quoted_quantity is None or pr_quantity is None:
            _add_finding(
                findings,
                rule_id="QUANTITY_NOT_EVALUABLE_REVIEW",
                title="Quantity cannot be evaluated",
                message=f"Quoted quantity for item {match.quoted_item_code} is missing or unclear.",
                severity="REVIEW",
                confirmed=False,
                field_path=f"quoted_items[{quoted_index}].quoted_quantity",
                observed_value=_field_text(quantity_field),
                expected_value=f"{pr_quantity} {match.matched_pr_unit or 'units'} requested",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )
        elif pr_quantity != 0:
            variance = abs(quoted_quantity - pr_quantity) / pr_quantity * Decimal("100")
            if variance > Decimal("5"):
                _add_finding(
                    findings,
                    rule_id="QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW",
                    title="Quantity differs by more than 5%",
                    message=(
                        f"Quoted quantity {quoted_quantity} differs from "
                        f"requested quantity {pr_quantity} by more than 5%."
                    ),
                    severity="REVIEW",
                    confirmed=True,
                    field_path=f"quoted_items[{quoted_index}].quoted_quantity",
                    observed_value=str(quoted_quantity),
                    expected_value=str(pr_quantity),
                    evidence=match.evidence[0] if match.evidence else None,
                    related_quoted_item_code=match.quoted_item_code,
                    related_pr_item_code=match.matched_pr_item_code,
                )

        if _field_status(currency_field) == "EXTRACTED":
            currency_value = str(_field_value(currency_field)).strip().upper()
            if currency_value != "BDT":
                _add_finding(
                    findings,
                    rule_id="QUOTED_CURRENCY_REVIEW",
                    title="Quotation currency differs from the PR currency",
                    message=f"Quoted currency is {currency_value}, while the purchase request uses BDT.",
                    severity="REVIEW",
                    confirmed=True,
                    field_path=f"quoted_items[{quoted_index}].currency",
                    observed_value=currency_value,
                    expected_value="BDT",
                    evidence=match.evidence[0] if match.evidence else None,
                    related_quoted_item_code=match.quoted_item_code,
                    related_pr_item_code=match.matched_pr_item_code,
                )

        all_values_available = quoted_quantity is not None and quoted_price is not None and quoted_line_total is not None
        if all_values_available:
            calculated_total = quoted_quantity * quoted_price
            if quoted_line_total != calculated_total:
                _add_finding(
                    findings,
                    rule_id="LINE_TOTAL_MISMATCH_REVIEW",
                    title="Line total does not agree with quantity and unit price",
                    message=(
                        f"Stated line total {quoted_line_total} does not equal "
                        f"{quoted_quantity} x {quoted_price} = {calculated_total}."
                    ),
                    severity="REVIEW",
                    confirmed=True,
                    field_path=f"quoted_items[{quoted_index}].line_total",
                    observed_value=str(quoted_line_total),
                    expected_value=str(calculated_total),
                    evidence=match.evidence[0] if match.evidence else None,
                    related_quoted_item_code=match.quoted_item_code,
                    related_pr_item_code=match.matched_pr_item_code,
                )
        elif quoted_quantity is not None or quoted_price is not None or quoted_line_total is not None:
            _add_finding(
                findings,
                rule_id="LINE_TOTAL_NOT_EVALUABLE_REVIEW",
                title="Line-total arithmetic cannot be evaluated",
                message=f"Line-total arithmetic for item {match.quoted_item_code} could not be checked because a value is missing.",
                severity="REVIEW",
                confirmed=False,
                field_path=f"quoted_items[{quoted_index}].line_total",
                observed_value=_field_text(line_total_field),
                expected_value="Quoted quantity, unit price, and line total",
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )

    # Unit mismatches remain review conditions. Floating units already downgraded in matcher,
    # so process notes that still mention them.
    for match in match_result.matches:
        if any("differs from PR unit" in note for note in match.notes):
            _add_finding(
                findings,
                rule_id="UNIT_MISMATCH_REVIEW",
                title="Quoted unit does not match the PR unit",
                message="The quoted unit differs from the selected purchase-request item unit.",
                severity="REVIEW",
                confirmed=True,
                field_path=f"quoted_items[{match.quoted_item_index}].quoted_unit",
                observed_value=match.quoted_unit,
                expected_value=match.matched_pr_unit,
                evidence=match.evidence[0] if match.evidence else None,
                related_quoted_item_code=match.quoted_item_code,
                related_pr_item_code=match.matched_pr_item_code,
            )

    reject_count = sum(1 for finding in findings if finding.severity == "REJECT")
    review_count = sum(1 for finding in findings if finding.severity == "REVIEW")
    confirmed_review_count = sum(
        1 for finding in findings if finding.severity == "REVIEW" and finding.confirmed
    )
    uncertain_review_count = sum(
        1 for finding in findings if finding.severity == "REVIEW" and not finding.confirmed
    )

    if reject_count:
        priority_titles = [finding.title for finding in findings if finding.severity == "REJECT"][:3]
        summary = "Reject recommended because: " + "; ".join(priority_titles) + "."
        decision = "REJECT"
    elif review_count:
        priority_titles = [finding.title for finding in findings if finding.severity == "REVIEW"][:3]
        summary = "Human review recommended because: " + "; ".join(priority_titles) + "."
        decision = "NEEDS_HUMAN_REVIEW"
    else:
        summary = "All applicable policy checks passed; no reject or review condition was triggered."
        decision = "APPROVE"

    return findings, DecisionResult(
        decision=decision,
        decision_summary=summary,
        rule_version=RULE_SET_VERSION,
        confirmed_reject_count=reject_count,
        review_count=review_count,
        confirmed_review_count=confirmed_review_count,
        uncertain_review_count=uncertain_review_count,
    )
