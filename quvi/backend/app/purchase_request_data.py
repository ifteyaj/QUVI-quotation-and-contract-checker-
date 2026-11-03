import csv
from decimal import Decimal
from pathlib import Path
from typing import Dict

from app.config import ASSESSMENT_DATA_DIR
from app.schemas import PurchaseRequest, PurchaseRequestItem


def load_purchase_requests() -> Dict[str, PurchaseRequest]:
    """Load the supplied assessment CSV without altering or inventing values."""
    csv_path = Path(ASSESSMENT_DATA_DIR) / "purchase-request.csv"
    if not csv_path.is_file():
        return {}

    requests: dict[str, list[PurchaseRequestItem]] = {}

    with csv_path.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        required_columns = {
            "PR number",
            "Item",
            "Description",
            "Unit",
            "Quantity requested",
            "Maximum unit price (BDT)",
        }
        if reader.fieldnames is None or not required_columns.issubset(reader.fieldnames):
            raise ValueError("purchase-request.csv is missing required columns")

        for row in reader:
            pr_number = (row["PR number"] or "").strip()
            item_code = (row["Item"] or "").strip()
            description = (row["Description"] or "").strip()
            unit = (row["Unit"] or "").strip()
            quantity = Decimal((row["Quantity requested"] or "").strip())
            maximum_price = Decimal((row["Maximum unit price (BDT)"] or "").strip())

            if not all([pr_number, item_code, description, unit]):
                raise ValueError("purchase-request.csv contains a blank required value")

            requests.setdefault(pr_number, []).append(
                PurchaseRequestItem(
                    item_code=item_code,
                    description=description,
                    unit=unit,
                    requested_quantity=quantity,
                    maximum_unit_price=maximum_price,
                )
            )

    return {
        pr_number: PurchaseRequest(
            pr_number=pr_number,
            title=pr_number,
            items=items,
        )
        for pr_number, items in requests.items()
    }


PURCHASE_REQUESTS = load_purchase_requests()
