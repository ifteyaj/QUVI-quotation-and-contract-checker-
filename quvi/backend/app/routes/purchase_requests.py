from typing import List

from fastapi import APIRouter, HTTPException

from app.purchase_request_data import PURCHASE_REQUESTS

router = APIRouter(prefix="/api/purchase-requests", tags=["purchase-requests"])


@router.get("/{pr_number}")
def get_purchase_request(pr_number: str) -> dict:
    purchase_request = PURCHASE_REQUESTS.get(pr_number)
    if purchase_request is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PURCHASE_REQUEST_NOT_FOUND",
                "message": "The requested purchase request is not available.",
            },
        )

    return purchase_request.model_dump(mode="json")


@router.get("")
async def list_purchase_requests() -> List[dict]:
    return [
        {"pr_number": pr_number, "title": purchase_request.title, "item_count": len(purchase_request.items)}
        for pr_number, purchase_request in PURCHASE_REQUESTS.items()
    ]
