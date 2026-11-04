#!/usr/bin/env python3
"""Run all supplier packs through the QUVI backend and save the results."""

from __future__ import annotations

import argparse
import json
import subprocess
import urllib.request
from pathlib import Path


def git_short_hash(repo_root: Path) -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def multipart_upload(url: str, fields: dict[str, str], file_field: str, file_path: Path) -> dict:
    boundary = "----quvi-real-run-boundary"
    chunks: list[bytes] = []

    for name, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        chunks.append(f"{value}\r\n".encode())

    chunks.append(f"--{boundary}\r\n".encode())
    chunks.append(
        (
            f'Content-Disposition: form-data; name="{file_field}"; '
            f'filename="{file_path.name}"\r\nContent-Type: application/pdf\r\n\r\n'
        ).encode()
    )
    chunks.append(file_path.read_bytes())
    chunks.append(f"\r\n--{boundary}--\r\n".encode())

    request = urllib.request.Request(
        url,
        data=b"".join(chunks),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--packs", required=True, type=Path)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    output_dir = Path("real-run-results") / git_short_hash(repo_root)
    output_dir.mkdir(parents=True, exist_ok=True)

    packs = sorted(args.packs.glob("supplier-pack-*.pdf"))
    if not packs:
        raise SystemExit(f"No supplier packs found in {args.packs}")

    print(f"Commit: {git_short_hash(repo_root)}")
    print(f"Packs: {len(packs)}")
    print(f"Output: {output_dir}")

    results = []
    for pack in packs:
        batch = multipart_upload(
            f"{args.base_url}/api/batches",
            {"purchase_request_id": "PR-2026-114"},
            "files",
            pack,
        )
        batch_file = output_dir / f"{pack.stem}.json"
        batch_file.write_text(json.dumps(batch, indent=2), encoding="utf-8")

        for document in batch.get("documents", []):
            findings = document["verification_result"]["findings"]
            evidence_values = [finding.get("evidence_text") for finding in findings]
            result = {
                "pack": pack.name,
                "batch_id": batch["batch_id"],
                "decision": document["verification_result"]["decision"]["decision"],
                "decision_summary": document["verification_result"]["decision"][
                    "decision_summary"
                ],
                "quotation_number": document["quotation_extraction"]["quotation_number"][
                    "value"
                ],
                "supplier_name": document["quotation_extraction"]["supplier_name"][
                    "value"
                ],
                "purchase_request_number": document["verification_result"][
                    "purchase_request_number"
                ],
                "findings": [
                    {
                        "rule_id": finding["rule_id"],
                        "title": finding["title"],
                        "page_number": finding.get("page_number"),
                        "evidence_length": len(finding.get("evidence_text") or ""),
                        "evidence_text": finding.get("evidence_text"),
                    }
                    for finding in findings
                ],
            }
            results.append(result)
            print(
                f"{pack.name}: {result['decision']} | findings={len(findings)} | "
                f"evidence_lengths={[len(x or '') for x in evidence_values]}"
            )

    (output_dir / "summary.json").write_text(
        json.dumps(results, indent=2), encoding="utf-8"
    )
    print(f"Saved {len(results)} document results to {output_dir}")


if __name__ == "__main__":
    main()
