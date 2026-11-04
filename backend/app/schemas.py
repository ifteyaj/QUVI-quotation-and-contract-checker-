"""Pydantic schemas for QUVI backend responses."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ExtractionStatus(str, Enum):
    EXTRACTED = "EXTRACTED"
    MISSING = "MISSING"          # absence confirmed by the document
    UNCLEAR = "UNCLEAR"
    NOT_LOCATED = "NOT_LOCATED"  # no pattern matched; absence not confirmed



class FieldEvidence(BaseModel):
    model_config = ConfigDict(frozen=True)

    page_number: int
    snippet: str
    source: str = "PDF_TEXT"


class ExtractedField(BaseModel, Generic[T]):
    status: ExtractionStatus
    value: Optional[T] = None
    evidence: List[FieldEvidence] = []


class ExtractedLineItem(BaseModel):
    item_code: Optional[ExtractedField[Any]] = Field(default=None)
    description: Optional[ExtractedField[Any]] = Field(default=None)
    quoted_quantity: Optional[ExtractedField[Any]] = Field(default=None)
    quoted_unit: Optional[ExtractedField[Any]] = Field(default=None)
    quoted_unit_price: Optional[ExtractedField[Any]] = Field(default=None)
    line_total: Optional[ExtractedField[Any]] = Field(default=None)
    currency: Optional[ExtractedField[Any]] = Field(default=None)
    evidence: List[FieldEvidence] = []


class ExtractedQuotation(BaseModel):
    supplier_name: Optional[ExtractedField[Any]] = Field(default=None)
    supplier_tin: Optional[ExtractedField[Any]] = Field(default=None)
    supplier_bin: Optional[ExtractedField[Any]] = Field(default=None)
    quotation_number: Optional[ExtractedField[Any]] = Field(default=None)
    quotation_date: Optional[ExtractedField[Any]] = Field(default=None)
    reference_pr_number: Optional[ExtractedField[Any]] = Field(default=None)
    currency: Optional[ExtractedField[Any]] = Field(default=None)
    quoted_items: List[ExtractedLineItem] = Field(default_factory=list)
    payment_terms: Optional[ExtractedField[Any]] = Field(default=None)
    advance_percent: Optional[ExtractedField[Any]] = Field(default=None)
    payment_days_after_delivery: Optional[ExtractedField[Any]] = Field(default=None)
    delivery_period: Optional[ExtractedField[Any]] = Field(default=None)
    delivery_days: Optional[ExtractedField[Any]] = Field(default=None)
    vat_rate_percent: Optional[ExtractedField[Any]] = Field(default=None)
    vat_separately_shown: Optional[ExtractedField[Any]] = Field(default=None)
    quotation_validity_days: Optional[ExtractedField[Any]] = Field(default=None)
    late_penalty_clause_present: Optional[ExtractedField[Any]] = Field(default=None)
    late_penalty_rate_per_week_percent: Optional[ExtractedField[Any]] = Field(default=None)
    extraction_notes: List[str] = []
    extraction_method: str = "regex-pattern-v1"



class PurchaseRequestItem(BaseModel):
    """Purchase-request item values copied from the assessment documentation."""

    model_config = ConfigDict(frozen=True)

    item_code: str
    description: str
    unit: str
    requested_quantity: Decimal
    maximum_unit_price: Decimal
    currency: str = "BDT"


class PurchaseRequest(BaseModel):
    model_config = ConfigDict(frozen=True)

    pr_number: str
    title: str
    items: List[PurchaseRequestItem]



class ItemMatchStatus(str, Enum):
    MATCHED = "MATCHED"
    AMBIGUOUS = "AMBIGUOUS"
    UNMATCHED = "UNMATCHED"
    NOT_EVALUATED = "NOT_EVALUATED"


class BusinessDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"


class FindingSeverity(str, Enum):
    REJECT = "REJECT"
    REVIEW = "REVIEW"
    INFO = "INFO"


class MatchedQuotationItem(BaseModel):
    match_id: str
    quoted_item_index: int
    quoted_item_code: Optional[str] = None
    quoted_description: Optional[str] = None
    quoted_quantity: Optional[str] = None
    quoted_unit: Optional[str] = None
    quoted_unit_price: Optional[str] = None
    quoted_line_total: Optional[str] = None
    quoted_currency: Optional[str] = None
    matched_pr_item_code: Optional[str] = None
    matched_pr_description: Optional[str] = None
    matched_pr_unit: Optional[str] = None
    requested_quantity: Optional[str] = None
    maximum_unit_price: Optional[str] = None
    match_status: ItemMatchStatus
    match_method: Optional[str] = None
    match_basis: List[str] = Field(default_factory=list)
    quantity_variance_percent: Optional[str] = None
    price_variance_percent: Optional[str] = None
    line_total_calculation_expected: Optional[str] = None
    line_total_matches: Optional[bool] = None
    currency_matches: Optional[bool] = None
    evidence: List[FieldEvidence] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class BusinessFinding(BaseModel):
    finding_id: str
    rule_id: str
    rule_version: str
    severity: FindingSeverity
    status: str
    title: str
    message: str
    confirmed: bool
    field_path: Optional[str] = None
    observed_value: Optional[Any] = None
    expected_value: Optional[Any] = None
    page_number: Optional[int] = None
    evidence_text: Optional[str] = None
    related_quoted_item_code: Optional[str] = None
    related_pr_item_code: Optional[str] = None


class DecisionResult(BaseModel):
    decision: BusinessDecision
    decision_summary: str
    rule_version: str
    confirmed_reject_count: int = 0
    review_count: int = 0
    confirmed_review_count: int = 0
    uncertain_review_count: int = 0


class VerificationResult(BaseModel):
    purchase_request_number: Optional[str] = None
    purchase_request_items: List[PurchaseRequestItem] = Field(default_factory=list)
    match_results: List[MatchedQuotationItem] = Field(default_factory=list)
    unmatched_quoted_items: List[str] = Field(default_factory=list)
    duplicate_pr_matches: List[str] = Field(default_factory=list)
    findings: List[BusinessFinding] = Field(default_factory=list)
    decision: DecisionResult
    verification_notes: List[str] = Field(default_factory=list)



class ExtractedPageResult(BaseModel):
    page_number: int
    text: str


class DocumentUploadResult(BaseModel):
    document_id: str
    original_filename: str
    stored_filename: str
    content_type: str
    size_bytes: int
    sha256: str
    processing_status: str
    page_count: int
    text_char_count: int
    extraction_method: str
    needs_ocr: bool
    pages: List[ExtractedPageResult]
    extracted_text: str
    quotation_extraction: ExtractedQuotation
    verification_result: VerificationResult
    created_at: datetime


class RejectedFileResult(BaseModel):
    filename: str
    error_code: str
    message: str


class BatchUploadResponse(BaseModel):
    batch_id: str
    purchase_request_id: Optional[str] = None
    created_at: datetime
    documents: List[DocumentUploadResult]
    rejected_files: List[RejectedFileResult] = []
