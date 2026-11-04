#!/usr/bin/env python3
"""Deliberate, repeatable evaluation harness for the QUVI assessment samples."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.pdf_extraction import extract_pdf_text
from app.quotation_extraction import extract_quotation_from_pages
from app.purchase_request_data import PURCHASE_REQUESTS
from app.pr_matching import match_quotation_to_pr
from app.rule_engine import RULE_SET_VERSION, evaluate_quotation_rules
from app.verification import build_verification_result

EVALUATION_VERSION = "1.0.0"


def _assessment_dir(default: Path) -> Path:
    return Path(default).resolve()


def _git_revision() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=Path(__file__).resolve().parents[1],
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def _count_statuses(value: Any) -> Dict[str, int]:
    counts = {"extracted": 0, "missing": 0, "unclear": 0}
    if isinstance(value, dict):
        raw_status = value.get("status", "")
        if hasattr(raw_status, "value"):
            raw_status = raw_status.value
        status = str(raw_status).lower()
        if status in counts:
            counts[status] += 1
        for child in value.values():
            child_counts = _count_statuses(child)
            for key, amount in child_counts.items():
                counts[key] += amount
    elif isinstance(value, list):
        for item in value:
            child_counts = _count_statuses(item)
            for key, amount in child_counts.items():
                counts[key] += amount
    return counts


def evaluate_document(filename: str, expected: Dict[str, Any], assessment_dir: Path) -> Dict[str, Any]:
    pdf_path = assessment_dir / filename
    if not pdf_path.is_file():
        raise FileNotFoundError(f"Assessment PDF not found: {pdf_path}")

    raw_pdf = pdf_path.read_bytes()
    extracted_pdf = extract_pdf_text(raw_pdf)
    quotation = extract_quotation_from_pages(extracted_pdf.pages)
    pr_number = str(expected.get("purchase_request_number", expected.get("pr_number", "PR-2026-114")))
    if pr_number not in PURCHASE_REQUESTS:
        raise KeyError(f"Purchase request from ground truth is not loaded: {pr_number}")

    verification_result = build_verification_result(quotation, pr_number)
    findings = verification_result.findings
    actual_rule_ids = [finding.rule_id for finding in findings]
    actual_decision = str(getattr(verification_result.decision.decision, 'value', verification_result.decision.decision))
    expected_decision = str(expected["expected_decision"])
    expected_rule_ids = sorted(set(expected.get("expected_rule_ids", [])))

    status_counts = _count_statuses(quotation.model_dump(mode="json"))

    record = {
        "filename": filename,
        "purchase_request_number": pr_number,
        "expected_processing_status": expected.get("expected_processing_status", "TEXT_EXTRACTED"),
        "actual_processing_status": "TEXT_EXTRACTED" if extracted_pdf.text_char_count > 0 else "OCR_REQUIRED",
        "expected_decision": expected_decision,
        "actual_decision": actual_decision,
        "decision_correct": expected_decision == actual_decision,
        "expected_rule_ids": expected_rule_ids,
        "actual_rule_ids": sorted(set(actual_rule_ids)),
        "missing_rule_ids": sorted(set(expected_rule_ids) - set(actual_rule_ids)),
        "extra_rule_ids": sorted(set(actual_rule_ids) - set(expected_rule_ids)),
        "all_expected_rules_present": set(expected_rule_ids).issubset(set(actual_rule_ids)),
        "no_extra_rules": set(actual_rule_ids).issubset(set(expected_rule_ids)),
        "page_count": extracted_pdf.page_count,
        "extracted_text_characters": extracted_pdf.text_char_count,
        "extracted_quoted_items": len(quotation.quoted_items),
        "extracted_field_status_counts": status_counts,
        "all_findings_have_evidence": bool(findings) and all(
            finding.page_number is not None or finding.evidence_text for finding in findings
        ),
        "findings": [
            {
                "finding_id": finding.finding_id,
                "rule_id": finding.rule_id,
                "severity": str(finding.severity),
                "status": finding.status,
                "title": finding.title,
                "message": finding.message,
                "confirmed": finding.confirmed,
                "observed_value": finding.observed_value,
                "expected_value": finding.expected_value,
                "page_number": finding.page_number,
                "evidence_text": finding.evidence_text,
            }
            for finding in findings
        ],
        "decision_summary": verification_result.decision.decision_summary,
        "expected_decision_rationale": expected.get("decision_rationale"),
        "policy_ambiguity": expected.get("policy_ambiguity", "None identified."),
        "verification_notes": verification_result.verification_notes,
    }
    return record


def build_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(records)
    correct_decisions = sum(1 for record in records if record["decision_correct"])
    rule_exact_matches = sum(
        1 for record in records if record["missing_rule_ids"] == [] and record["extra_rule_ids"] == []
    )
    return {
        "documents_evaluated": total,
        "correct_decisions": correct_decisions,
        "decision_accuracy_percent": round((correct_decisions / total) * 100, 2) if total else 0.0,
        "rule_set_exact_matches": rule_exact_matches,
        "rule_set_exact_match_percent": round((rule_exact_matches / total) * 100, 2) if total else 0.0,
        "false_approvals": sum(
            1 for record in records if record["expected_decision"] in {"REJECT", "NEEDS_HUMAN_REVIEW"} and record["actual_decision"] == "APPROVE"
        ),
        "false_rejections": sum(
            1 for record in records if record["expected_decision"] in {"APPROVE", "NEEDS_HUMAN_REVIEW"} and record["actual_decision"] == "REJECT"
        ),
        "unnecessary_human_reviews": sum(
            1 for record in records if record["expected_decision"] in {"APPROVE", "REJECT"} and record["actual_decision"] == "NEEDS_HUMAN_REVIEW"
        ),
        "missed_human_reviews": sum(
            1 for record in records if record["expected_decision"] == "NEEDS_HUMAN_REVIEW" and record["actual_decision"] != "NEEDS_HUMAN_REVIEW"
        ),
        "correct_human_review_decisions": sum(
            1 for record in records if record["expected_decision"] == "NEEDS_HUMAN_REVIEW" and record["actual_decision"] == "NEEDS_HUMAN_REVIEW"
        ),
        "extracted_field_status_totals": {
            "extracted": sum(record["extracted_field_status_counts"]["extracted"] for record in records),
            "missing": sum(record["extracted_field_status_counts"]["missing"] for record in records),
            "unclear": sum(record["extracted_field_status_counts"]["unclear"] for record in records),
        },
        "documents_with_findings_missing_evidence": sum(
            1 for record in records if record["findings"] and not record["all_findings_have_evidence"]
        ),
    }


def build_markdown(results: Dict[str, Any]) -> str:
    lines = [
        "# QUVI assessment evaluation report",
        "",
        f"- Generated: {results['generated_at']}",
        f"- Evaluation version: {results['evaluation_version']}",
        f"- Rule version: {results['rule_version']}",
        f"- Source revision: {results['source_revision']}",
        f"- Ground truth: `{results['ground_truth_path']}`",
        f"- Assessment directory: `{results['assessment_directory']}`",
        "",
        "## Summary",
        "",
        f"- Documents evaluated: {results['metrics']['documents_evaluated']}",
        f"- Decision accuracy: {results['metrics']['correct_decisions']}/{results['metrics']['documents_evaluated']} ({results['metrics']['decision_accuracy_percent']}%)",
        f"- Exact rule ID set matches: {results['metrics']['rule_set_exact_matches']}/{results['metrics']['documents_evaluated']}",
        f"- False approvals: {results['metrics']['false_approvals']}",
        f"- False rejections: {results['metrics']['false_rejections']}",
        f"- Unnecessary human reviews: {results['metrics']['unnecessary_human_reviews']}",
        f"- Missed human reviews: {results['metrics']['missed_human_reviews']}",
        f"- Correct human-review decisions: {results['metrics']['correct_human_review_decisions']}",
        "",
        "## Per-document results",
        "",
        "| Document | Expected decision | Actual decision | Correct | Expected rule IDs | Actual rule IDs |",
        "|---|---|---|---:|---|---|",
    ]
    for record in results["documents"]:
        lines.append(
            "| {filename} | {expected} | {actual} | {correct} | {expected_ids} | {actual_ids} |".format(
                filename=record["filename"],
                expected=record["expected_decision"],
                actual=record["actual_decision"],
                correct="Yes" if record["decision_correct"] else "No",
                expected_ids=", ".join(record["expected_rule_ids"]) or "none",
                actual_ids=", ".join(record["actual_rule_ids"]) or "none",
            )
        )

    mismatches = [
        record for record in results["documents"] if not record["decision_correct"] or record["missing_rule_ids"] or record["extra_rule_ids"]
    ]
    lines.extend(["", "## Rule and decision mismatches", ""])
    if not mismatches:
        lines.append("No decision or rule-ID mismatches were found in this evaluation run.")
    else:
        for record in mismatches:
            lines.append(f"### {record['filename']}")
            lines.append(f"- Expected decision: {record['expected_decision']}")
            lines.append(f"- Actual decision: {record['actual_decision']}")
            lines.append(f"- Missing rules: {', '.join(record['missing_rule_ids']) or 'none'}")
            lines.append(f"- Extra rules: {', '.join(record['extra_rule_ids']) or 'none'}")
            lines.append(f"- Decision summary: {record['decision_summary']}")
            lines.append("")

    lines.extend(["", "## Rule and defect notes", ""])
    all_notes = []
    for record in results["documents"]:
        if record["missing_rule_ids"] or record["extra_rule_ids"]:
            all_notes.append(
                f"{record['filename']}: missing={record['missing_rule_ids']}, extra={record['extra_rule_ids']}"
            )
        if not record["all_findings_have_evidence"] and record["actual_rule_ids"]:
            all_notes.append(f"{record['filename']}: at least one finding has no page or evidence snippet.")
    if not all_notes:
        all_notes.append("No mismatches were detected. This indicates current implementation outputs align with the independent expected outcomes for all 10 documents.")
    for note in all_notes:
        lines.append(f"- {note}")

    lines.extend(
        [
            "",
            "## Extracted field status totals",
            "",
            f"- Extracted: {results['metrics']['extracted_field_status_totals']['extracted']}",
            f"- Missing: {results['metrics']['extracted_field_status_totals']['missing']}",
            f"- Unclear: {results['metrics']['extracted_field_status_totals']['unclear']}",
            "",
            "## Scope note",
            "",
            "Processing was performed only when the evaluation command was explicitly run on the 10 assessment PDFs. The normal application does not automatically load or process assessment samples.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate QUVI against the 10 assessment documents.")
    parser.add_argument(
        "--ground-truth",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "docs" / "evaluation" / "ground-truth.json",
    )
    parser.add_argument(
        "--assessment-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "docs" / "assessment",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "docs" / "evaluation",
    )
    parser.add_argument("--fail-on-mismatch", action="store_true")
    args = parser.parse_args()

    ground_truth_path = args.ground_truth.resolve()
    assessment_dir = args.assessment_dir.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    with ground_truth_path.open("r", encoding="utf-8") as ground_truth_file:
        ground_truth = json.load(ground_truth_file)

    expected_documents = ground_truth.get("documents", [])
    expected_filenames = [entry["filename"] for entry in expected_documents]
    if len(expected_filenames) != 10:
        raise ValueError(f"Ground truth must contain exactly 10 documents, found {len(expected_filenames)}.")
    available_pdf_paths = sorted(assessment_dir.glob("supplier-pack-*.pdf"))
    actual_filenames = sorted(path.name for path in available_pdf_paths)
    if actual_filenames != sorted(expected_filenames):
        raise ValueError(
            "Assessment PDF set does not match ground truth. "
            f"Expected {sorted(expected_filenames)}, found {actual_filenames}."
        )

    expected_by_filename = {entry["filename"]: entry for entry in expected_documents}
    records = [
        evaluate_document(filename, expected_by_filename[filename], assessment_dir)
        for filename in sorted(expected_filenames)
    ]
    summary = build_summary(records)

    results = {
        "evaluation_version": EVALUATION_VERSION,
        "rule_version": RULE_SET_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_revision": _git_revision(),
        "ground_truth_path": str(ground_truth_path),
        "assessment_directory": str(assessment_dir),
        "ground_truth_name": ground_truth.get("dataset_name"),
        "metrics": summary,
        "documents": records,
    }

    json_path = output_dir / "evaluation-results.json"
    markdown_path = output_dir / "evaluation-report.md"
    with json_path.open("w", encoding="utf-8") as output_file:
        json.dump(results, output_file, indent=2, sort_keys=False)
        output_file.write("\n")
    markdown_path.write_text(build_markdown(results), encoding="utf-8")

    print(json.dumps(summary, indent=2))
    print(f"Wrote {json_path}")
    print(f"Wrote {markdown_path}")

    if args.fail_on_mismatch and (
        summary["correct_decisions"] != summary["documents_evaluated"]
        or summary["rule_set_exact_matches"] != summary["documents_evaluated"]
    ):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
