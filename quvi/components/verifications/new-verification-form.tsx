"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/purchase-requests";
import {
  getPurchaseRequest,
  uploadQuotationBatch,
  type BatchUploadResult,
} from "@/lib/api";
import type { PurchaseRequestResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function ExtractionStatusBadge({ status }: { status: string }) {
  const className =
    status === "EXTRACTED"
      ? "bg-success/10 text-success"
      : status === "UNCLEAR"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground";

  return <Badge className={className}>{status}</Badge>;
}

function validateFile(file: File): string | null {
  const isPdfByType = file.type === "application/pdf";
  const isPdfByName = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfByType && !isPdfByName) {
    return "Only PDF quotation files are accepted.";
  }

  if (file.size === 0) {
    return "The selected PDF is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "The PDF must be 25 MB or smaller.";
  }

  return null;
}

export function NewVerificationForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [purchaseRequestNumber, setPurchaseRequestNumber] = useState("PR-2026-114");
  const [purchaseRequestData, setPurchaseRequestData] =
    useState<PurchaseRequestResponse | null>(null);
  const [isPurchaseRequestLoading, setIsPurchaseRequestLoading] = useState(false);
  const [purchaseRequestError, setPurchaseRequestError] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchUploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPurchaseRequestLoading(true);
    setPurchaseRequestData(null);
    setPurchaseRequestError(null);

    getPurchaseRequest(purchaseRequestNumber)
      .then((data) => {
        if (active) {
          setPurchaseRequestData(data);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPurchaseRequestError(
            error instanceof Error
              ? error.message
              : "The purchase request could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsPurchaseRequestLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [purchaseRequestNumber]);

  const acceptFile = useCallback((file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setFileError(validationError);
      return;
    }

    setSelectedFile(file);
    setFileError(null);
    setSubmitError(null);
    setResult(null);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        acceptFile(file);
      }
    },
    [acceptFile]
  );

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        acceptFile(file);
      }
    },
    [acceptFile]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    setSubmitError(null);
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleStartVerification = useCallback(async () => {
    if (!selectedFile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await uploadQuotationBatch(
        [selectedFile],
        purchaseRequestNumber || undefined
      );
      setResult(response);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The quotation could not be uploaded."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, purchaseRequestNumber, selectedFile]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a supplier quotation PDF to create a new QUVI verification request.
          The file is validated and stored by the backend before later extraction and
          policy checks are added.
        </p>
      </header>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Purchase Request
          </CardTitle>
          <CardDescription>
            Select the purchase request for quotation comparison.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="purchase-request"
          >
            Purchase request
          </label>
          <select
            id="purchase-request"
            className="h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            value={purchaseRequestNumber}
            onChange={(event) => setPurchaseRequestNumber(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="PR-2026-114">PR-2026-114 — Purchase request from assessment data</option>
          </select>

          {isPurchaseRequestLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading purchase request from backend...
            </div>
          )}

          {purchaseRequestError && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {purchaseRequestError}
            </div>
          )}

          {purchaseRequestData && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Supplied purchase request items
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Item</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4">Unit</th>
                      <th className="py-2 pr-4 text-right">Quantity</th>
                      <th className="py-2 text-right">Max price (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRequestData.items.map((item) => (
                      <tr
                        key={item.item_code}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="py-2 pr-4 font-medium text-foreground">
                          {item.item_code}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {item.description}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {item.unit}
                        </td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">
                          {Number(item.requested_quantity).toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {Number(item.maximum_unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Quotation Document
          </CardTitle>
          <CardDescription>
            Upload one supplier quotation in PDF format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
            aria-label="Select quotation PDF"
          />

          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-8 transition-colors",
              isDragging
                ? "border-primary bg-primary-light"
                : "border-border bg-muted/30",
              selectedFile ? "bg-card" : ""
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-light">
                <UploadCloud className="size-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Drag and drop a PDF quotation here
                </p>
                <p className="text-xs text-muted-foreground">
                  or select a file from your computer
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="size-4" />
                Browse files
              </Button>
              <p className="text-xs text-muted-foreground">
                PDF only, up to 25 MB.
              </p>
            </div>
          </div>

          {fileError && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {fileError}
            </div>
          )}

          {selectedFile && (
            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedFile.type || "application/pdf"} •{" "}
                  {formatBytes(selectedFile.size)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected PDF. Backend validation will confirm that it is a valid
                  PDF.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                aria-label="Remove selected file"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}

          {previewUrl && selectedFile && (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                title="Selected PDF preview"
                src={previewUrl}
                className="h-72 w-full border-0"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {result
                ? "The file has been stored and queued for later processing."
                : "No verification decision is created at upload time."}
            </p>
            <Button
              type="button"
              onClick={handleStartVerification}
              disabled={!selectedFile || isSubmitting || Boolean(fileError)}
              className="min-w-40 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Start Verification
                </>
              )}
            </Button>
          </div>

          {submitError && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {submitError}
            </div>
          )}
        </CardContent>
      </Card>

      {isSubmitting && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="size-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Uploading and storing the quotation. Please wait.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Upload Result
            </CardTitle>
            <CardDescription>
              The backend accepted the quotation. Business verification is not
              performed at this stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Batch ID</dt>
                <dd className="font-medium text-foreground">{result.batch_id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Purchase request</dt>
                <dd className="font-medium text-foreground">
                  {result.purchase_request_id ?? "Not selected"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Receipt time</dt>
                <dd className="font-medium text-foreground">
                  {new Date(result.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Documents queued</dt>
                <dd className="font-medium text-foreground">
                  {result.documents.length}
                </dd>
              </div>
            </dl>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Original file</th>
                    <th className="px-4 py-3">Document ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Size</th>
                    <th className="px-4 py-3">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {result.documents.map((document) => (
                    <tr
                      key={document.document_id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {document.original_filename}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {document.document_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                          {document.processing_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatBytes(document.size_bytes)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {document.sha256.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.documents.map((document) => {
              const extraction = document.quotation_extraction;
              const scalarFields = [
                ["Supplier", extraction.supplier_name],
                ["TIN", extraction.supplier_tin],
                ["BIN", extraction.supplier_bin],
                ["Quotation number", extraction.quotation_number],
                ["Quotation date", extraction.quotation_date],
                ["Reference PR", extraction.reference_pr_number],
                ["Currency", extraction.currency],
                ["Payment terms", extraction.payment_terms],
                ["Advance", extraction.advance_percent],
                ["Payment days", extraction.payment_days_after_delivery],
                ["Delivery period", extraction.delivery_period],
                ["Delivery days", extraction.delivery_days],
                ["VAT rate", extraction.vat_rate_percent],
                ["VAT shown separately", extraction.vat_separately_shown],
                ["Validity days", extraction.quotation_validity_days],
                ["Penalty clause", extraction.late_penalty_clause_present],
                ["Penalty rate", extraction.late_penalty_rate_per_week_percent],
              ] as const;

              return (
                <div
                  key={`${document.document_id}-extraction`}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground">
                      Structured quotation extraction
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Technical field extraction only. Missing or unclear values
                      are preserved and are not treated as verified facts.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {scalarFields.map(([label, field]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-1 break-words text-sm text-foreground">
                            {formatFieldValue(field?.value)}
                          </p>
                          {field && field.evidence.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              p. {field.evidence[0].page_number}:{" "}
                              {field.evidence[0].snippet}
                            </p>
                          )}
                        </div>
                        <ExtractionStatusBadge status={field?.status ?? "MISSING"} />
                      </div>
                    ))}
                  </div>

                  {extraction.quoted_items.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-3">Item</th>
                            <th className="py-2 pr-3">Description</th>
                            <th className="py-2 pr-3 text-right">Qty</th>
                            <th className="py-2 pr-3">Unit</th>
                            <th className="py-2 pr-3 text-right">Unit price</th>
                            <th className="py-2 pr-3 text-right">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extraction.quoted_items.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-border last:border-b-0"
                            >
                              <td className="py-2 pr-3 text-foreground">
                                {formatFieldValue(item.item_code.value)}
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground">
                                {formatFieldValue(item.description.value)}
                              </td>
                              <td className="py-2 pr-3 text-right text-muted-foreground">
                                {formatFieldValue(item.quoted_quantity.value)}
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground">
                                {formatFieldValue(item.quoted_unit.value)}
                              </td>
                              <td className="py-2 pr-3 text-right text-muted-foreground">
                                {formatFieldValue(item.quoted_unit_price.value)}
                              </td>
                              <td className="py-2 text-right text-muted-foreground">
                                {formatFieldValue(item.line_total.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {extraction.extraction_notes.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {extraction.extraction_notes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {result.documents.map((document) => {
              const verification = document.verification_result;
              const rejectFindings = verification.findings.filter((f) => f.severity === "REJECT");
              const reviewFindings = verification.findings.filter((f) => f.severity === "REVIEW");

              return (
                <div
                  key={`${document.document_id}-verification`}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Business decision
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deterministic result from the company policy. This is not
                        an extraction result.
                      </p>
                    </div>
                    <Badge
                      className={
                        verification.decision.decision === "REJECT"
                          ? "bg-danger/10 text-danger"
                          : verification.decision.decision === "NEEDS_HUMAN_REVIEW"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }
                    >
                      {verification.decision.decision}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground">
                    {verification.decision.decision_summary}
                  </p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-3">Quoted item</th>
                          <th className="py-2 pr-3">PR item</th>
                          <th className="py-2 pr-3">Match</th>
                          <th className="py-2 pr-3 text-right">Qty variance</th>
                          <th className="py-2 pr-3 text-right">Price variance</th>
                          <th className="py-2">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verification.match_results.map((match, index) => (
                          <tr
                            key={index}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="py-2 pr-3 text-foreground">
                              {match.quoted_item_code || `Item ${match.quoted_item_index + 1}`}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground">
                              {match.matched_pr_item_code || "—"}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground">
                              {match.match_status}
                              {match.match_method ? ` (${match.match_method})` : ""}
                            </td>
                            <td className="py-2 pr-3 text-right text-muted-foreground">
                              {match.quantity_variance_percent
                                ? `${match.quantity_variance_percent}%`
                                : "—"}
                            </td>
                            <td className="py-2 pr-3 text-right text-muted-foreground">
                              {match.price_variance_percent
                                ? `${match.price_variance_percent}%`
                                : "—"}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {match.line_total_matches === null || match.line_total_matches === undefined
                                ? "n/a"
                                : match.line_total_matches
                                  ? "matches"
                                  : "mismatch"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-md border border-danger/30 bg-danger/10 p-3">
                      <p className="text-sm font-medium text-danger">
                        Reject findings ({rejectFindings.length})
                      </p>
                      {rejectFindings.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          None.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-3 text-sm">
                          {rejectFindings.map((finding) => (
                            <li key={finding.finding_id}>
                              <p className="font-medium text-foreground">
                                {finding.title}
                              </p>
                              <p className="text-muted-foreground">
                                {finding.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {finding.evidence_text
                                  ? `p. ${finding.page_number}: ${finding.evidence_text}`
                                  : "No evidence snippet available."}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
                      <p className="text-sm font-medium text-warning">
                        Review findings ({reviewFindings.length})
                      </p>
                      {reviewFindings.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          None.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-3 text-sm">
                          {reviewFindings.map((finding) => (
                            <li key={finding.finding_id}>
                              <p className="font-medium text-foreground">
                                {finding.title}
                                {!finding.confirmed && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (uncertain)
                                  </span>
                                )}
                              </p>
                              <p className="text-muted-foreground">
                                {finding.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {finding.evidence_text
                                  ? `p. ${finding.page_number}: ${finding.evidence_text}`
                                  : "No evidence snippet available."}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {verification.verification_notes.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {verification.verification_notes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {result.documents.map((document) => (
              <div
                key={`${document.document_id}-text`}
                className="rounded-lg border border-border bg-muted/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Extracted text
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.page_count} page(s), {document.text_char_count} characters,
                      method: {document.extraction_method}
                      {document.needs_ocr ? " · needs OCR fallback" : ""}
                    </p>
                  </div>
                </div>

                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
                  {document.extracted_text
                    ? document.extracted_text.slice(0, 2000) +
                      (document.extracted_text.length > 2000 ? "\n\n..." : "")
                    : "(No text extracted. A scanned PDF may require OCR.)"}
                </pre>
              </div>
            ))}

            {result.rejected_files.length > 0 && (
              <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <p className="font-medium">Some files were not accepted:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.rejected_files.map((rejected, index) => (
                    <li key={`${rejected.filename}-${index}`}>
                      {rejected.filename}: {rejected.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
