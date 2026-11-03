"""Match extracted quotation items against the selected purchase request."""

from __future__ import annotations

import difflib
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from typing import Any, List, Optional, Sequence

from app.pdf_extraction import ExtractedPage
from app.purchase_request_data import PURCHASE_REQUESTS
from app.schemas import ExtractedField, ExtractedLineItem, PurchaseRequestItem


def _field_status(field: Optional[ExtractedField[Any]]) -> str:
    return field.status.value if field is not None else "MISSING"


def _field_value(field: Optional[ExtractedField[Any]]):
    if field is None:
        return None
    return field.value


def _to_decimal(value: object) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    text = str(value).strip().replace(",", "").replace(" ", "")
    if not text:
        return None
    try:
        return Decimal(text)
    except (InvalidOperation, ValueError):
        return None


def _to_int(value: object) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    try:
        return int(str(value).strip().replace(",", "").replace(" ", ""))
    except ValueError:
        return None


def _normalize_text(value: Optional[str]) -> str:
    return " ".join((value or "").lower().split())


def _similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    return difflib.SequenceMatcher(None, left, right).ratio()


@dataclass
class MatchedQuotationItem:
    match_id: str
    quoted_item_index: int
    quoted_item_code: Optional[str]
    quoted_description: Optional[str]
    quoted_quantity: Optional[Decimal]
    quoted_unit: Optional[str]
    quoted_unit_price: Optional[Decimal]
    quoted_line_total: Optional[Decimal]
    quoted_currency: Optional[str]
    matched_pr_item_code: Optional[str] = None
    matched_pr_description: Optional[str] = None
    matched_pr_unit: Optional[str] = None
    requested_quantity: Optional[Decimal] = None
    maximum_unit_price: Optional[Decimal] = None
    match_status: str = "UNMATCHED"
    match_method: Optional[str] = None
    match_basis: List[str] = field(default_factory=list)
    quantity_variance_percent: Optional[Decimal] = None
    price_variance_percent: Optional[Decimal] = None
    line_total_calculation_expected: Optional[Decimal] = None
    line_total_matches: Optional[bool] = None
    currency_matches: Optional[bool] = None
    evidence: List[object] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


@dataclass
class MatchResult:
    purchase_request_number: Optional[str]
    purchase_request_items: list
    matches: List[MatchedQuotationItem]
    unmatched_quoted_items: List[int]
    duplicate_pr_matches: List[str]
    notes: List[str]


def match_quotation_to_pr(
    extraction,
    pr_number: Optional[str],
) -> MatchResult:
    pr = PURCHASE_REQUESTS.get(pr_number) if pr_number else None
    pr_items = list(pr.items) if pr is not None else []
    if pr_number is not None and pr is None:
        return MatchResult(
            purchase_request_number=pr_number,
            purchase_request_items=[],
            matches=[],
            unmatched_quoted_items=[],
            duplicate_pr_matches=[],
            notes=[f"Purchase request {pr_number} is not available."],
        )

    matches: List[MatchedQuotationItem] = []
    used_pr_codes: set[str] = set()
    duplicate_codes: set[str] = set()

    for item_index, quoted in enumerate(extraction.quoted_items):
        quoted_code = _field_value(quoted.item_code)
        quoted_code = str(quoted_code).strip() if quoted_code is not None else None
        quoted_code_status = _field_status(quoted.item_code)
        description = _field_value(quoted.description)
        description = str(description).strip() if description is not None else None
        quantity = _to_decimal(_field_value(quoted.quoted_quantity))
        unit = _field_value(quoted.quoted_unit)
        unit = str(unit).strip() if unit is not None else None
        price = _to_decimal(_field_value(quoted.quoted_unit_price))
        line_total = _to_decimal(_field_value(quoted.line_total))
        currency = _field_value(quoted.currency)
        currency = str(currency).strip() if currency is not None else None
        evidence = list(quoted.evidence or [])
        if not evidence:
            for candidate in (
                quoted.item_code,
                quoted.description,
                quoted.quoted_quantity,
                quoted.quoted_unit_price,
                quoted.line_total,
            ):
                if candidate is not None and getattr(candidate, "evidence", None):
                    evidence = list(candidate.evidence)
                    break

        normalized_description = _normalize_text(description)
        match_id = f"match_{item_index}"
        result = MatchedQuotationItem(
            match_id=match_id,
            quoted_item_index=item_index,
            quoted_item_code=quoted_code,
            quoted_description=description,
            quoted_quantity=quantity,
            quoted_unit=unit,
            quoted_unit_price=price,
            quoted_line_total=line_total,
            quoted_currency=currency,
            match_status="UNMATCHED",
            evidence=evidence,
        )

        candidates: List[PurchaseRequestItem] = []
        method: Optional[str] = None
        basis: List[str] = []

        if quoted_code and quoted_code_status != "UNCLEAR":
            code_candidate = next(
                (pr_item for pr_item in pr_items if pr_item.item_code.upper() == quoted_code.upper()),
                None,
            )
            if code_candidate is not None:
                candidates.append(code_candidate)
                method = "ITEM_CODE"
                basis.append("Exact item code match to the selected purchase request.")

        if not candidates and quoted_code_status == "UNCLEAR" and quoted_code:
            result.notes.append("The quoted item code is unclear, so it was not used for matching.")

        if not candidates and normalized_description:
            exact_candidates = [
                pr_item
                for pr_item in pr_items
                if _normalize_text(pr_item.description) == normalized_description
            ]
            if exact_candidates:
                if len(exact_candidates) == 1:
                    candidate = exact_candidates[0]
                    if unit is None or _normalize_text(unit) == _normalize_text(candidate.unit):
                        candidates.append(candidate)
                        method = "DESCRIPTION_AND_UNIT"
                        basis.append("Exact normalized description and unit match.")
                    else:
                        method = None
                        result.notes.append(
                            "Description matched, but the quoted unit differs from the PR item unit."
                        )
                else:
                    candidates.extend(exact_candidates)
                    method = "AMBIGUOUS_DESCRIPTION"
                    basis.append("The description matches more than one PR item.")

        if not candidates and normalized_description:
            fuzzy_candidates = [
                pr_item
                for pr_item in pr_items
                if _similarity(normalized_description, _normalize_text(pr_item.description)) >= 0.86
            ]
            if fuzzy_candidates:
                candidates.extend(fuzzy_candidates)
                method = "FUZZY_DESCRIPTION"
                basis = [
                    "Description is similar to a PR item but not exact; exact confirmation is required."
                ]

        if candidates:
            candidate = candidates[0]
            if candidate.item_code in used_pr_codes:
                duplicate_codes.add(candidate.item_code)
                result.match_status = "AMBIGUOUS"
                result.match_method = method
                result.match_basis.clear()
                result.match_basis.extend(basis)
                result.match_basis.append(
                    "The PR item was already matched to another quoted item."
                )
                result.notes.append("Potential duplicate mapping; treated as ambiguous.")
            else:
                result.match_status = "MATCHED" if len(candidates) == 1 else "AMBIGUOUS"
                result.match_method = method if len(candidates) == 1 else "AMBIGUOUS_DESCRIPTION"
                result.match_basis.clear()
                result.match_basis.extend(basis)
                if len(candidates) == 1:
                    result.matched_pr_item_code = candidate.item_code
                    result.matched_pr_description = candidate.description
                    result.matched_pr_unit = candidate.unit
                    result.requested_quantity = candidate.requested_quantity
                    result.maximum_unit_price = candidate.maximum_unit_price
                    used_pr_codes.add(candidate.item_code)
                    if method == "FUZZY_DESCRIPTION":
                        result.match_status = "AMBIGUOUS"
                        result.match_basis = [
                            "Description is similar but not exact. Exact PR mapping was not confirmed."
                        ]
                else:
                    result.match_status = "AMBIGUOUS"
                    result.match_basis = [
                        "Multiple PR items are plausible for this quotation item."
                    ]

        if candidates and result.match_status == "MATCHED":
            result.matched_pr_item_code = candidates[0].item_code
            result.matched_pr_description = candidates[0].description
            result.matched_pr_unit = candidates[0].unit
            result.requested_quantity = candidates[0].requested_quantity
            result.maximum_unit_price = candidates[0].maximum_unit_price

            if price is not None and result.maximum_unit_price is not None:
                denominator = result.maximum_unit_price
                if denominator != 0:
                    result.price_variance_percent = (
                        (price - result.maximum_unit_price) / denominator * Decimal("100")
                    ).quantize(Decimal("0.0001"))

            if quantity is not None and result.requested_quantity is not None:
                denominator = result.requested_quantity
                if denominator != 0:
                    result.quantity_variance_percent = (
                        abs(quantity - result.requested_quantity) / denominator * Decimal("100")
                    ).quantize(Decimal("0.0001"))

        if not candidates:
            result.match_status = "UNMATCHED"
            result.match_method = None
            if not normalized_description:
                result.notes.append("No item code or description was available for matching.")
            else:
                result.notes.append("No PR item matched the quoted item with sufficient confidence.")

        # Detect unit mismatch for matched mappings that use code.
        if (
            result.match_status == "MATCHED"
            and result.quoted_unit
            and result.matched_pr_unit
            and _normalize_text(result.quoted_unit) != _normalize_text(result.matched_pr_unit)
        ):
            result.notes.append(
                f"Quoted unit {result.quoted_unit} differs from PR unit {result.matched_pr_unit}."
            )
            result.match_status = "AMBIGUOUS"
            result.match_method = "UNIT_MISMATCH"
            result.match_basis = ["Item code matched, but the quoted unit differs from the PR unit."]
            result.matched_pr_item_code = None
            result.matched_pr_description = None
            result.matched_pr_unit = None
            result.requested_quantity = None
            result.maximum_unit_price = None

        quoted_amount = None
        calculated_price_result: Optional[Decimal] = None
        if result.matched_pr_item_code is not None and quantity is not None and price is not None:
            calculated_price_result = quantity * price  # reserved for line total
            if line_total is not None:
                result.line_total_matches = line_total == calculated_price_result
            result.line_total_calculation_expected = calculated_price_result if line_total is not None else None

        if result.matched_pr_item_code is not None and unit is not None and currency is not None:
            result.currency_matches = currency.upper().strip() == "BDT"

        matches.append(result)

    unmatched_indexes = [
        m.quoted_item_index for m in matches if m.match_status != "MATCHED"
    ]

    notes = []
    if pr is None and pr_number is not None:
        notes.append(f"Selected purchase request {pr_number} could not be loaded.")
    if not pr_items:
        notes.append("No purchase request items were available for matching.")

    return MatchResult(
        purchase_request_number=pr_number,
        purchase_request_items=pr_items,
        matches=matches,
        unmatched_quoted_items=unmatched_indexes,
        duplicate_pr_matches=sorted(duplicate_codes),
        notes=notes,
    )
