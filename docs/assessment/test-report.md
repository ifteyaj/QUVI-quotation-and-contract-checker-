# QUVI — Test Report

**Status:** Test report template — populate after implementation and test execution.  
**Do not present this document as evidence that tests have already passed.**

## Environment
- Commit / revision: `TBD`
- Date: `TBD`
- Python version: `TBD`
- Node version: `TBD`
- Model/provider and model ID: `TBD`
- Prompt version: `TBD`
- Rule version: `TBD`
- Dataset files evaluated: `TBD`

## Automated test execution
| Test suite | Command | Result | Notes |
|---|---|---|---|
| Backend unit tests | `pytest` | Not run yet | Record pass/fail counts and failures. |
| API integration tests | `pytest` (actual configured path) | Not run yet | Replace with exact command used. |
| Frontend checks | Actual package scripts | Not run yet | Record lint/typecheck/build outcomes. |
| Sample evaluation | Actual evaluation command | Not run yet | Record dataset size and model settings. |

## Sample-by-sample evaluation
| File | Expected decision | Actual decision | Critical extraction issues | Evidence complete? | Notes |
|---|---|---|---|---|---|
| supplier-pack-01.pdf | TBD from independently labeled ground truth | Not run | TBD | TBD | |
| supplier-pack-02.pdf | TBD from independently labeled ground truth | Not run | TBD | TBD | |
| supplier-pack-03.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-04.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-05.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-06.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-07.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-08.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-09.pdf | Pending file | Not run | N/A | N/A | |
| supplier-pack-10.pdf | Pending file | Not run | N/A | N/A | |

## Metrics to calculate
- Decision accuracy: `correct decisions / evaluated documents`
- Critical field exactness: exact matches for labeled critical fields
- Hard-reject recall
- Review-routing recall
- False approval rate
- Evidence coverage: triggered findings with source excerpt and page
- Batch resilience: remaining files complete when one file fails
- Per-document and total processing time

For a ten-document set, include raw counts alongside percentages because one example changes the percentage by 10 points.

## Known limitations / incidents
- Not yet populated. Add observed extraction errors, OCR issues, ambiguous policy cases, false positives/negatives, and performance limitations after testing.

## Sign-off
- Tester: `TBD`
- Date: `TBD`
- Review status: `TBD`
