from __future__ import annotations

from fastapi import APIRouter

from app.rule_engine import RULE_SET_VERSION

router = APIRouter(prefix="/api", tags=["policy"])


@router.get("/rules")
async def get_policy_rules() -> dict:
    return {
        "rule_version": RULE_SET_VERSION,
        "source": "docs/assessment/company-rules.md",
        "approval": "None of the reject or review conditions applies.",
        "reject_rules": [
            "Unit price is more than 3% above the maximum unit price in the purchase request.",
            "Advance payment is more than 20%.",
            "The contract has no late-delivery penalty clause.",
            "The supplier's TIN or BIN is missing.",
            "Delivery is promised later than 45 days after the purchase order.",
        ],
        "review_rules": [
            "Unit price is above the maximum, but by no more than 3%.",
            "Quantity differs from the quantity requested by more than 5%.",
            "Payment terms are unclear, or outside 30 to 60 days after delivery.",
            "Delivery is promised in 31 to 45 days.",
            "VAT is not shown separately at 15%.",
            "The numbers do not add up, for example line total or subtotal is wrong.",
            "The quotation is valid for less than 30 days.",
            "A late-delivery penalty clause exists but is below 0.5% of order value per week, or required fields remain missing or unclear.",
        ],
        "notes": [
            "The late-delivery penalty must be at least 0.5% of order value per week of delay.",
            "Always quote the exact source text that supports the decision.",
            "If you are not sure, the result is NEEDS_HUMAN_REVIEW; never guess.",
        ],
    }
