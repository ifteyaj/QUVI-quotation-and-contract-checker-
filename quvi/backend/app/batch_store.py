"""In-memory storage for the current FastAPI process.

This is intentionally lightweight process state. It lets an uploaded batch be
reviewed after the upload response has been returned, while preserving the
existing scan-for-scan upload behavior. It is not a durable database and is lost
when the API process restarts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Dict, List, Optional

from app.schemas import BatchUploadResponse


@dataclass
class StoredBatch:
    batch_id: str
    response: BatchUploadResponse
    file_paths: Dict[str, Path] = field(default_factory=dict)


class BatchStore:
    def __init__(self) -> None:
        self._batches: Dict[str, StoredBatch] = {}
        self._lock = Lock()

    def save(
        self,
        response: BatchUploadResponse,
        file_paths: Optional[Dict[str, Path]] = None,
    ) -> BatchUploadResponse:
        with self._lock:
            self._batches[response.batch_id] = StoredBatch(
                batch_id=response.batch_id,
                response=response,
                file_paths=dict(file_paths or {}),
            )
        return response

    def get(self, batch_id: str) -> Optional[BatchUploadResponse]:
        with self._lock:
            stored = self._batches.get(batch_id)
            return stored.response if stored is not None else None

    def list_recent(self, limit: int = 25) -> List[BatchUploadResponse]:
        with self._lock:
            batches = sorted(
                self._batches.values(),
                key=lambda stored: stored.response.created_at,
                reverse=True,
            )
            return [stored.response for stored in batches[:limit]]

    def get_file_path(self, batch_id: str, document_id: str) -> Optional[Path]:
        with self._lock:
            stored = self._batches.get(batch_id)
            if stored is None:
                return None
            return stored.file_paths.get(document_id)


batch_store = BatchStore()
