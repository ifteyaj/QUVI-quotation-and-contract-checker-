from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.batches import router as batches_router
from app.routes.purchase_requests import router as purchase_requests_router
from app.routes.policy import router as policy_router

app = FastAPI(title="QUVI", description="Explainable supplier quotation checker backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(batches_router)
app.include_router(purchase_requests_router)
app.include_router(policy_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Avoid exposing internal exception details, paths, or stack traces.
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred.",
            }
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "QUVI"}