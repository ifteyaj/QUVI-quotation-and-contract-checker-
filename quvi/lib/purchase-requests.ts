// Frontend formatting helpers for purchase-request and document display.
// Purchase-request values are now loaded from the QUVI backend, which reads
// docs/assessment/purchase-request.csv.

export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
