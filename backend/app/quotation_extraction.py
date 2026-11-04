"""Regex-based structured quotation extraction from PDF text."""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Any, Callable, List, Optional, Sequence, Tuple

from app.pdf_extraction import ExtractedPage
from app.schemas import (
    ExtractedField,
    ExtractedLineItem,
    ExtractedQuotation,
    ExtractionStatus,
    FieldEvidence,
)


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.split())


def _truncate(value: str, limit: int = 280) -> str:
    value = value.strip()
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip() + "..."


def _page_for_match(pages: Sequence[ExtractedPage], needle: str) -> FieldEvidence:
    """Find a source evidence snippet for a value already found in PDF text."""
    clean_needle = _normalize_whitespace(needle)
    if not clean_needle:
        return FieldEvidence(
            page_number=pages[0].page_number if pages else 1,
            snippet="",
        )

    for page in pages:
        haystack = _normalize_whitespace(page.text)
        position = haystack.lower().find(clean_needle.lower())
        if position >= 0:
            start = max(0, position - 100)
            end = min(len(haystack), position + len(clean_needle) + 100)
            return FieldEvidence(
                page_number=page.page_number, snippet=_truncate(haystack[start:end])
            )

    return FieldEvidence(
        page_number=pages[0].page_number if pages else 1,
        snippet="",
    )


def _search_pages(
    pages: Sequence[ExtractedPage], pattern: re.Pattern[str]
) -> List[Tuple[ExtractedPage, re.Match[str]]]:
    found: List[Tuple[ExtractedPage, re.Match[str]]] = []
    for page in pages:
        for match in pattern.finditer(page.text):
            found.append((page, match))
    return found


def _text_for_all(pages: Sequence[ExtractedPage]) -> str:
    return "\n\n".join(f"Page {page.page_number}\n{page.text}" for page in pages)


def _missing() -> ExtractedField:
    return ExtractedField(status=ExtractionStatus.MISSING)


def _not_located() -> ExtractedField:
    return ExtractedField(status=ExtractionStatus.NOT_LOCATED)


TIN_KEYWORD = re.compile(r"\bTIN\b|Tax Identification", re.IGNORECASE)
BIN_KEYWORD = re.compile(r"\bBIN\b|Business Identification", re.IGNORECASE)
PENALTY_WORD = re.compile(r"\b(?:penalty|penalties|delay|late)\b", re.IGNORECASE)
TERMS_HEADING = re.compile(r"TERMS AND CONDITIONS", re.IGNORECASE)


def _extract_identifier(
    pages: Sequence[ExtractedPage],
    value_pattern: re.Pattern[str],
    keyword_pattern: re.Pattern[str],
    absence_evidence: List[FieldEvidence],
    can_confirm_absence: bool,
) -> ExtractedField[str]:
    """TIN/BIN: MISSING only when the label is absent and the header was readable."""
    field = _extract_text_value(pages, value_pattern, "value")
    if field.status != ExtractionStatus.NOT_LOCATED:
        return field
    if _search_pages(pages, keyword_pattern):
        # The label is in the text but no value parsed: uncertain, not absent.
        return _not_located()
    if can_confirm_absence:
        return ExtractedField(
            status=ExtractionStatus.MISSING, value=None, evidence=absence_evidence
        )
    return _not_located()


def _penalty_absence_basis(pages: Sequence[ExtractedPage]) -> Optional[FieldEvidence]:
    """Return evidence that the penalty clause is absent, or None if not confirmable."""
    if _search_pages(pages, PENALTY_WORD):
        return None
    terms = _search_pages(pages, TERMS_HEADING)
    if not terms:
        return None
    return _page_for_match(pages, terms[0][1].group(0))


def _extract_text_value(
    pages: Sequence[ExtractedPage], pattern: re.Pattern[str], group: str = "value"
) -> ExtractedField[str]:
    matches = _search_pages(pages, pattern)

    if not matches:
        return _not_located()

    distinct_values = {match.group(group).strip() for _, match in matches}

    value = matches[0][1].group(group).strip()
    evidence = _page_for_match(pages, matches[0][1].group(0))

    if len(matches) > 1 and len(distinct_values) > 1:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR,
            value=None,
            evidence=[evidence],
        )

    return ExtractedField(
        status=ExtractionStatus.EXTRACTED,
        value=value,
        evidence=[evidence],
    )


def _extract_decimal_value(
    pages: Sequence[ExtractedPage], pattern: re.Pattern[str], group: str = "value"
) -> ExtractedField[Decimal]:
    matches = _search_pages(pages, pattern)

    if not matches:
        return _not_located()

    first_value_text = matches[0][1].group(group)
    evidence = _page_for_match(pages, matches[0][1].group(0))
    distinct: set[str] = set()
    converted = None
    failed = False

    for _, match in matches:
        distinct.add(match.group(group).strip())

    try:
        converted = Decimal(
            first_value_text.strip().replace(",", "").replace(" ", "")
        )
    except (InvalidOperation, ValueError):
        failed = True

    if failed:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR, value=None, evidence=[evidence]
        )

    if len(matches) > 1 and len(distinct) > 1:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR, value=None, evidence=[evidence]
        )

    return ExtractedField(
        status=ExtractionStatus.EXTRACTED, value=converted, evidence=[evidence]
    )


def _extract_integer_value(
    pages: Sequence[ExtractedPage], pattern: re.Pattern[str], group: str = "value"
) -> ExtractedField[int]:
    matches = _search_pages(pages, pattern)

    if not matches:
        return _not_located()

    first_text = matches[0][1].group(group)
    evidence = _page_for_match(pages, matches[0][1].group(0))
    distinct = {match.group(group).strip() for _, match in matches}

    try:
        value = int(first_text.strip().replace(",", "").replace(" ", ""))
    except ValueError:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR, value=None, evidence=[evidence]
        )

    if len(matches) > 1 and len(distinct) > 1:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR, value=None, evidence=[evidence]
        )

    return ExtractedField(
        status=ExtractionStatus.EXTRACTED, value=value, evidence=[evidence]
    )


def _extract_boolean(
    pages: Sequence[ExtractedPage],
    present: bool,
    evidence_needle: str,
    *,
    value_when_present: bool,
) -> ExtractedField[bool]:
    if present:
        return ExtractedField(
            status=ExtractionStatus.EXTRACTED,
            value=value_when_present,
            evidence=[_page_for_match(pages, evidence_needle)],
        )
    return _not_located()


def _extract_text_field(
    pages: Sequence[ExtractedPage],
    regex: re.Pattern[str],
    group: str = "value",
) -> ExtractedField[str]:
    matches = _search_pages(pages, regex)

    if not matches:
        return _not_located()

    raw_value = matches[0][1].group(group).strip()
    evidence = _page_for_match(pages, matches[0][1].group(0))

    if len(matches) > 1 and {m.group(group).strip() for _, m in matches} != {raw_value}:
        return ExtractedField(
            status=ExtractionStatus.UNCLEAR, value=None, evidence=[evidence]
        )

    return ExtractedField(
        status=ExtractionStatus.EXTRACTED,
        value=_normalize_whitespace(raw_value),
        evidence=[evidence],
    )


def _match_with_status(
    pages: Sequence[ExtractedPage], regex: re.Pattern[str], converter: Callable[[str], object]
):
    matches = _search_pages(pages, regex)

    if not matches:
        return ExtractionStatus.NOT_LOCATED, None, None

    values = []
    for _, match in matches:
        try:
            values.append(converter(match.group(0)))
        except (ValueError, InvalidOperation):
            values.append(None)

    if any(value is None for value in values):
        status = ExtractionStatus.UNCLEAR
    elif len(values) > 1 and len({str(value) for value in values}) > 1:
        status = ExtractionStatus.UNCLEAR
    else:
        status = ExtractionStatus.EXTRACTED

    try:
        value = converter(matches[0][1].group(0)) if status == ExtractionStatus.EXTRACTED else None
    except (ValueError, InvalidOperation):
        value = None
        status = ExtractionStatus.UNCLEAR

    evidence = _page_for_match(pages, matches[0][1].group(0))
    return status, value, evidence


def extract_quotation_from_pages(
    pages: Sequence[ExtractedPage],
) -> ExtractedQuotation:
    """Extract a conservative schema-shaped quotation from page text."""
    combined_text = _text_for_all(pages)
    notes: List[str] = []

    supplier_pattern = re.compile(
        r"^(?P<value>[A-Za-z][A-Za-z &./'()-]{2,})\s*\nQUOTATION\b",
        re.MULTILINE,
    )
    quotation_number_pattern = re.compile(r"Quotation\s*no\.?\s*(?P<value>[A-Z0-9-]+)", re.I)
    date_pattern = re.compile(r"\bDate\b\s*(?P<value>\d{4}-\d{2}-\d{2})", re.I)
    reference_pattern = re.compile(r"Reference\s*(?P<value>PR-[A-Za-z0-9-]+)", re.I)
    header_pattern = re.compile(r"Unit price \((?P<value>BDT)\)", re.I)
    token_pattern = re.compile(r"\b(?P<value>BDT)\b")
    payment_pattern = re.compile(
        r"(?:^|\n)\d*\.\s*Payment\.?\s*(?P<value>.*?)(?=\n\d+\.\s*(?:Delivery|Delay|Validity|Quality|Disputes)\.|$)",
        re.IGNORECASE | re.DOTALL,
    )
    advance_pattern = re.compile(r"(?P<value>\d+(?:\.\d+)?)\s*%\s*advance", re.I)
    payment_days_pattern = re.compile(r"within\s*(?P<value>\d+)\s*days", re.I)
    delivery_pattern = re.compile(
        r"(?:^|\n)\d*\.\s*Delivery\.?\s*(?P<value>.*?)(?=\n\d+\.\s*(?:Delay|Validity|Quality|Disputes|Payment)\.|$)",
        re.IGNORECASE | re.DOTALL,
    )
    delivery_days_pattern = re.compile(r"(\d+)\s*days\b", re.I)
    delivery_weeks_pattern = re.compile(r"(\d+)\s*weeks?\b", re.I)
    vat_rate_pattern = re.compile(r"VAT\s*(?P<value>\d+(?:\.\d+)?)\s*%", re.I)
    vat_present_pattern = re.compile(r"\bVAT\b", re.I)
    validity_pattern = re.compile(r"valid\s*(?:for|until)?\s*(?P<value>\d+)\s*days", re.I)
    late_clause_pattern = re.compile(
        r"(?i)\b(?:late[- ]?delivery\s+penalty|late delivery penalty|delay in delivery will attract a penalty|late delivery)\b"
    )
    late_rate_pattern = re.compile(
        r"(?P<value>\d+(?:\.\d+)?)\s*%[^.\n]*?(?:week|week of delay)",
        re.IGNORECASE,
    )
    item_pattern = re.compile(
        r"^(?P<code>[A-Z])\s*\n(?P<description>.+?)\s*\n(?P<quantity>[\d,\s]+?)\s*\n(?P<unit>[A-Za-z][A-Za-z /-]*?)\s*\n(?P<unit_price>[\d,.]+)\s*\n(?P<line_total>[\d,.]+)",
        re.MULTILINE | re.DOTALL,
    )

    supplier_field = _extract_text_value(pages, supplier_pattern, "value")
    quotation_number = _extract_text_value(pages, quotation_number_pattern, "value")
    quotation_date = _extract_text_value(pages, date_pattern, "value")
    reference_pr_number = _extract_text_value(pages, reference_pattern, "value")
    header_matches = _search_pages(pages, header_pattern)
    currency_matches = header_matches if header_matches else _search_pages(pages, token_pattern)
    currency_status = ExtractionStatus.EXTRACTED if currency_matches else ExtractionStatus.NOT_LOCATED
    currency_value = currency_matches[0][1].group("value").upper() if currency_matches else None
    currency_evidence = (
    _page_for_match(pages, currency_matches[0][1].group(0)) if currency_matches else FieldEvidence(page_number=pages[0].page_number if pages else 1, snippet="")
)

    payment_match = payment_pattern.search(combined_text)
    payment_terms = ExtractedField[str](
        status=ExtractionStatus.EXTRACTED if payment_match else ExtractionStatus.NOT_LOCATED,
        value=_normalize_whitespace(payment_match.group("value")) if payment_match else None,
        evidence=[_page_for_match(pages, payment_match.group(0))] if payment_match else [],
    )
    if payment_match is None:
        notes.append("Payment terms were not found in the document text.")

    advance_percent = _extract_decimal_value(pages, advance_pattern, "value")
    if advance_percent.status != ExtractionStatus.EXTRACTED and re.search(
        r"no advance payment", combined_text, re.IGNORECASE
    ):
        advance_percent = ExtractedField[Any](
            status=ExtractionStatus.EXTRACTED,
            value=Decimal("0"),
            evidence=[_page_for_match(pages, "No advance payment")],
        )

    payment_days = _not_located()
    if payment_match is not None:
        payment_days_candidate = payment_days_pattern.search(payment_match.group("value"))
        if payment_days_candidate is not None:
            payment_days = ExtractedField[Any](
                status=ExtractionStatus.EXTRACTED,
                value=int(payment_days_candidate.group("value")),
                evidence=[_page_for_match(pages, payment_days_candidate.group(0))],
            )
    if payment_terms.status == ExtractionStatus.EXTRACTED and " to " in (payment_terms.value or ""):
        payment_days = ExtractedField[Any](
            status=ExtractionStatus.UNCLEAR,
            value=None,
            evidence=payment_days.evidence,
        )
        notes.append("Payment days contain a range or ambiguous wording.")

    delivery_match = delivery_pattern.search(combined_text)
    delivery_period = ExtractedField[str](
        status=ExtractionStatus.EXTRACTED if delivery_match else ExtractionStatus.NOT_LOCATED,
        value=_normalize_whitespace(delivery_match.group("value")) if delivery_match else None,
        evidence=[_page_for_match(pages, delivery_match.group(0))] if delivery_match else [],
    )
    if delivery_match is None:
        notes.append("Delivery information was not found in the document text.")

    delivery_days: ExtractedField[Any]
    delivery_source_text = delivery_match.group("value") if delivery_match else ""
    week_match = delivery_weeks_pattern.search(delivery_source_text)
    day_match = delivery_days_pattern.search(delivery_source_text)

    if week_match and not day_match:
        delivery_days = ExtractedField[Any](
            status=ExtractionStatus.EXTRACTED,
            value=int(week_match.group(1)) * 7,
            evidence=[_page_for_match(pages, delivery_match.group(0))] if delivery_match else [],
        )
        notes.append(
            "Delivery was stated in weeks and converted exactly to days (1 week = 7 days)."
        )
    elif day_match:
        delivery_days = ExtractedField[Any](
            status=ExtractionStatus.EXTRACTED,
            value=int(day_match.group(1)),
            evidence=[_page_for_match(pages, delivery_match.group(0))] if delivery_match else [],
        )
    else:
        delivery_days = _not_located()

    vat_rate = _extract_decimal_value(pages, vat_rate_pattern, "value")
    vat_present = vat_present_pattern.search(combined_text) is not None
    vat_line_evidence = _page_for_match(pages, "VAT") if vat_present else _page_for_match(pages, "")
    vat_separately_shown = ExtractedField[bool](
        status=ExtractionStatus.EXTRACTED if vat_present else ExtractionStatus.NOT_LOCATED,
        value=True if "VAT 15%" in combined_text else None,
        evidence=[vat_line_evidence] if vat_present and "VAT 15%" in combined_text else [],
    )
    if vat_present and "VAT 15%" not in combined_text:
        notes.append("VAT is mentioned, but a separate 15% item is not clearly present.")

    validity = _extract_integer_value(pages, validity_pattern, "value")

    late_clause = bool(late_clause_pattern.search(combined_text))
    late_rate = _extract_decimal_value(pages, late_rate_pattern, "value")
    late_rate_evidence = late_rate.evidence

    if late_clause and late_rate.status != ExtractionStatus.EXTRACTED:
        notes.append("A late-delivery penalty clause is mentioned, but its rate is not clear.")
        late_clause_present = ExtractedField[bool](
            status=ExtractionStatus.EXTRACTED,
            value=True,
            evidence=late_rate_evidence or [_page_for_match(pages, "penalty")],
        )
    elif late_clause:
        late_clause_present = ExtractedField[bool](
            status=ExtractionStatus.EXTRACTED,
            value=True,
            evidence=late_rate_evidence,
        )
    else:
        absence_basis = _penalty_absence_basis(pages)
        if absence_basis is not None:
            notes.append("No late-delivery penalty clause was found in a readable terms section.")
            late_clause_present = ExtractedField[bool](
                status=ExtractionStatus.MISSING, value=False, evidence=[absence_basis]
            )
        else:
            notes.append("Late-delivery penalty clause could not be located.")
            late_clause_present = ExtractedField[bool](
                status=ExtractionStatus.NOT_LOCATED, value=None, evidence=[]
            )

    if not late_clause:
        late_rate = ExtractedField[Any](status=ExtractionStatus.NOT_LOCATED, value=None, evidence=[])

    quoted_items: List[ExtractedLineItem] = []
    seen_rows = set()

    for match in item_pattern.finditer(combined_text):
        code = match.group("code").strip()
        description = _normalize_whitespace(match.group("description"))
        quantity_raw = match.group("quantity").strip()
        unit = _normalize_whitespace(match.group("unit"))
        unit_price_raw = match.group("unit_price").strip()
        line_total_raw = match.group("line_total").strip()

        row_key = (code, quantity_raw, unit_price_raw, line_total_raw)
        if row_key in seen_rows:
            continue
        seen_rows.add(row_key)

        row_evidence = _page_for_match(pages, match.group(0))

        try:
            quantity_value: object = Decimal(quantity_raw.replace(",", "").replace(" ", ""))
        except InvalidOperation:
            quantity_value = None

        try:
            unit_price_value: object = Decimal(unit_price_raw.replace(",", "").replace(" ", ""))
        except InvalidOperation:
            unit_price_value = None

        try:
            line_total_value: object = Decimal(line_total_raw.replace(",", "").replace(" ", ""))
        except InvalidOperation:
            line_total_value = None

        quoted_items.append(
            ExtractedLineItem(
                item_code=ExtractedField[str](
                    status=ExtractionStatus.EXTRACTED,
                    value=code,
                    evidence=[row_evidence],
                ),
                description=ExtractedField[str](
                    status=ExtractionStatus.EXTRACTED,
                    value=description,
                    evidence=[row_evidence],
                ),
                quoted_quantity=ExtractedField[Any](
                    status=ExtractionStatus.EXTRACTED if quantity_value is not None else ExtractionStatus.UNCLEAR,
                    value=quantity_value,
                    evidence=[row_evidence],
                ),
                quoted_unit=ExtractedField[str](
                    status=ExtractionStatus.EXTRACTED,
                    value=unit,
                    evidence=[row_evidence],
                ),
                quoted_unit_price=ExtractedField[Any](
                    status=ExtractionStatus.EXTRACTED if unit_price_value is not None else ExtractionStatus.UNCLEAR,
                    value=unit_price_value,
                    evidence=[row_evidence],
                ),
                line_total=ExtractedField[Any](
                    status=ExtractionStatus.EXTRACTED if line_total_value is not None else ExtractionStatus.UNCLEAR,
                    value=line_total_value,
                    evidence=[row_evidence],
                ),
                currency=ExtractedField[str](
                    status=currency_status,
                    value=currency_value,
                    evidence=[_page_for_match(pages, currency_matches[0][1].group(0))]
                    if currency_matches
                    else [],
                ),
                evidence=[row_evidence],
            )
        )

    if not quoted_items:
        notes.append("No quoted line item table was found in the PDF text.")

    supplier = ExtractedField[str](
        status=ExtractionStatus.EXTRACTED if supplier_field.value is not None else ExtractionStatus.NOT_LOCATED,
        value=supplier_field.value,
        evidence=supplier_field.evidence,
    )

    can_confirm_identifier_absence = (
        supplier.status == ExtractionStatus.EXTRACTED
        and quotation_number.status == ExtractionStatus.EXTRACTED
    )
    supplier_tin = _extract_identifier(
        pages,
        re.compile(r"Supplier TIN:[ \t]*(?P<value>[A-Za-z0-9-]+)", re.I),
        TIN_KEYWORD,
        supplier.evidence,
        can_confirm_identifier_absence,
    )
    supplier_bin = _extract_identifier(
        pages,
        re.compile(r"BIN:[ \t]*(?P<value>[A-Za-z0-9-]+)", re.I),
        BIN_KEYWORD,
        supplier.evidence,
        can_confirm_identifier_absence,
    )

    return ExtractedQuotation(
        supplier_name=supplier,
        supplier_tin=supplier_tin,
        supplier_bin=supplier_bin,
        quotation_number=quotation_number,
        quotation_date=quotation_date,
        reference_pr_number=reference_pr_number,
        currency=ExtractedField[str](
            status=currency_status,
            value=currency_value,
            evidence=[_page_for_match(pages, currency_matches[0][1].group(0))] if currency_matches else [],
        ),
        quoted_items=quoted_items,
        payment_terms=payment_terms,
        advance_percent=advance_percent,
        payment_days_after_delivery=payment_days,
        delivery_period=delivery_period,
        delivery_days=delivery_days,
        vat_rate_percent=vat_rate,
        vat_separately_shown=vat_separately_shown,
        quotation_validity_days=validity,
        late_penalty_clause_present=late_clause_present,
        late_penalty_rate_per_week_percent=late_rate,
        extraction_notes=notes,
        extraction_method="regex-pattern-v1",
    )
