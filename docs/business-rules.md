# QUVI — Business Rules and Decision Policy

## Source
The rules below are transcribed from the supplied fictional Aamar Garments Ltd `company-rules.md`. Interpretations and boundary behavior are called out separately.

## Reject rules
Any confirmed condition below results in `REJECT`:
1. Unit price is **more than 3% above** the PR maximum unit price.
2. Advance payment is **more than 20%**.
3. No late-delivery penalty clause exists.
4. Supplier TIN or BIN is missing.
5. Delivery is promised **later than 45 days** after the purchase order.

## Needs human review rules
If no confirmed reject condition applies, any of the following results in `NEEDS_HUMAN_REVIEW`:
1. Unit price is above PR maximum, but by no more than 3%.
2. Quantity differs from requested quantity by more than 5%.
3. Payment terms are unclear or outside 30–60 days after delivery.
4. Delivery is promised in 31–45 days.
5. VAT is not separately shown at 15%.
6. Calculations do not add up (line total/subtotal, etc.).
7. Quotation validity is less than 30 days.
8. Any important field or evidence is missing, ambiguous, or cannot be evaluated safely.

## Approve
Approve only when no reject or review condition applies and all applicable checks have been evaluated.

## Additional note
Late-delivery penalty must be at least **0.5% of order value per week of delay**. The source does not explicitly say whether a present-but-below-threshold penalty is Reject or Review. The safe implementation is **Needs human review**, and this policy ambiguity should be disclosed rather than silently inventing a hard rejection.

## Evidence rule
Always quote the exact text from the document that supports the decision. If uncertain, use Needs human review; never guess.

## Purchase request reference
PR-2026-114:
| Item | Description | Unit | Quantity | Maximum unit price (BDT) |
|---|---|---:|---:|---:|
| A | Cotton twill fabric, 280 gsm | metre | 12,000 | 480.00 |
| B | Metal zipper, 18 cm | piece | 20,000 | 38.00 |
| C | Polyester sewing thread, cone | cone | 800 | 210.00 |
| D | Poly bag, 30 x 40 cm | piece | 50,000 | 6.50 |
| E | Carton box, 5-ply | piece | 3,000 | 95.00 |

## Explicit boundary interpretation
- Price exactly 3% above max: Review; more than 3%: Reject.
- Advance exactly 20%: does not trigger the >20% reject rule.
- Quantity variance exactly 5%: does not trigger the >5% review rule.
- Delivery exactly 30 days: does not trigger the 31–45 day review; 31–45: Review; more than 45: Reject.
- Payment 30–60 days after delivery inclusive: within stated range.
- Quotation validity exactly 30 days: does not trigger the less-than-30 review rule.
- VAT separately shown at 15%: passes the VAT review rule.
- A missing required identifier or ambiguous evidence is never treated as a pass.

## Precedence
1. Evaluate all checks and record findings.
2. If any confirmed Reject finding exists, final system decision is Reject.
3. Else if any Review or Not Evaluated finding exists, decision is Needs human review.
4. Else decision is Approve.

## Calculation notes
For a matched item:
- `price_variance_pct = (quoted_unit_price - PR_max_unit_price) / PR_max_unit_price * 100`
- `quantity_variance_pct = abs(quoted_quantity - PR_quantity) / PR_quantity * 100`
Use decimal arithmetic for currency and threshold comparisons. Document the treatment of rounding; do not round a value before comparing it to a threshold.
