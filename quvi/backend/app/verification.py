"""Orchestrate matching, policy evaluation, and verification aggregation."""

from __future__ import annotations

from typing import Optional

from app.pr_matching import MatchedQuotationItem as MatchedQuotationRecord
from app.pr_matching import match_quotation_to_pr
from app.rule_engine import evaluate_quotation_rules
from app.schemas import MatchedQuotationItem, VerificationResult
from app.purchase_request_data import PURCHASE_REQUESTS


def _decimal_to_str(value) -> Optional[str]:
    return None if value is None else str(value)


def build_verification_result(extraction, pr_number: Optional[str]) -> VerificationResult:
    match_result = match_quotation_to_pr(extraction, pr_number)
    findings, decision = evaluate_quotation_rules(extraction, match_result)

    pr = PURCHASE_REQUESTS.get(pr_number) if pr_number else None
    pr_items = list(pr.items) if pr is not None else match_result.purchase_request_items

    match_results = [
        MatchedQuotationItem(
            match_id=m.match_id,
            quoted_item_index=m.quoted_item_index,
            quoted_item_code=m.quoted_item_code,
            quoted_description=m.quoted_description,
            quoted_quantity=_decimal_to_str(m.quoted_quantity),
            quoted_unit=m.quoted_unit,
            quoted_unit_price=_decimal_to_str(m.quoted_unit_price),
            quoted_line_total=_decimal_to_str(m.quoted_line_total),
            quoted_currency=m.quoted_currency,
            matched_pr_item_code=m.matched_pr_item_code,
            matched_pr_description=m.matched_pr_description,
            matched_pr_unit=m.matched_pr_unit,
            requested_quantity=_decimal_to_str(m.requested_quantity),
            maximum_unit_price=_decimal_to_str(m.maximum_unit_price),
            match_status=m.match_status,
            match_method=m.match_method,
            match_basis=m.match_basis,
            quantity_variance_percent=_decimal_to_str(m.quantity_variance_percent),
            price_variance_percent=_decimal_to_str(m.price_variance_percent),
            line_total_calculation_expected=_decimal_to_str(m.line_total_calculation_expected),
            line_total_matches=m.line_total_matches,
            currency_matches=m.currency_matches,
            evidence=m.evidence,
            notes=m.notes,
        )
        for m in match_result.matches
    ]

    unmatched = [
        str(m.quoted_description or m.quoted_item_code or m.match_id)
        for m in match_result.matches
        if m.match_status != "MATCHED"
    ]

    notes = list(match_result.notes)
    if match_result.purchase_request_number is not None and not pr_items:
        notes.append("No purchase-request items were loaded for this selection.")

    return VerificationResult(
        purchase_request_number=match_result.purchase_request_number,
        purchase_request_items=pr_items,
        match_results=match_results,
        unmatched_quoted_items=unmatched,
        duplicate_pr_matches=match_result.duplicate_pr_matches,
        findings=findings,
        decision=decision,
        verification_notes=notes,
    )
