# QUVI UI rules (binding for all frontend work)

## Data
1. Every value shown on screen comes from the backend. No hard-coded
   quotation numbers, names, amounts, dates or rule text.
2. Do not import `lib/mock-data.ts` in any page or component. Delete it
   once the pages use the real client.
3. All API calls go through `frontend/lib/api.ts`. Components never call
   `fetch` directly.
4. Types in `api.ts` must mirror `backend/app/schemas.py`. If a field is
   optional in the schema, type it `| null` in TypeScript.
5. Do not invent a field the backend does not return. If the UI needs
   something missing, stop and report it instead of guessing.
6. Do not change backend code in UI tasks, unless a task says so.

## Findings and evidence
7. Rule text (title, message) is displayed as returned by the backend.
   Never write a reason in the frontend that the engine did not produce.
8. Show evidence only as the backend's `evidence_text` or
   `FieldEvidence.snippet`. Never edit, trim or rebuild it.
9. If an evidence snippet is shorter than 40 characters or starts or ends
   mid-word, show "Source line unavailable" instead of the fragment.
10. Every finding card shows its page number when `page_number` is not null.

## Decision wording
11. APPROVE shows "Passed automated checks". Add "Final approval rests
    with a person." Never say "Approved" alone.
12. REJECT shows "Rejected: N issue(s) found".
13. NEEDS_HUMAN_REVIEW shows "Needs a person to check".
14. Use the backend's `decision_summary` as the sentence under the hero.

## Formatting
15. Money: `BDT 36.00`, thousands separators. Never `$`.
16. Percent: `0.75% per week`, `15% VAT`. Store and compare numbers
    as returned; format only for display.
17. Dates: `22 Oct 2026`.
18. Status always has text plus colour, never colour alone.

## Pages
19. Only ship pages that work with real data: Dashboard, Verification
    detail, New Verification, Purchase Requests, Rules & Policy.
    Hide others behind "Coming soon".
20. Hide "View Full Report" unless a real route exists.
21. Buyer name is "Aamar Garments Ltd (fictional)".

## Process
22. Before each task, list the files you will change.
23. After each task, run `npm run build` and `npm run lint`. Report errors
    verbatim. Do not claim success without them.
24. Test three real packs: 02 (Approve), 03 (Reject), 07 (Needs a person).
    Report the exact values shown for each.
25. Commit after each numbered task with a message that names the task.