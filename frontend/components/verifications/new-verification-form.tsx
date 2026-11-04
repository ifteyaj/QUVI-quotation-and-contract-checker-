"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/purchase-requests";
import {
  getPurchaseRequest,
  listPurchaseRequests,
  uploadQuotationBatch,
  type PurchaseRequestResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type PurchaseRequestOption = {
  pr_number: string;
  title: string;
  item_count: number;
};

function validateFile(file: File): string | null {
  const isPdfByType = file.type === "application/pdf";
  const isPdfByName = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfByType && !isPdfByName) {
    return "Only PDF files can be checked.";
  }

  if (file.size === 0) {
    return "The selected PDF is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "This file is larger than 10 MB.";
  }

  return null;
}

function requestOptionLabel(request: PurchaseRequestOption): string {
  if (request.title && request.title !== request.pr_number) {
    return `${request.pr_number} — ${request.title}`;
  }

  return request.pr_number;
}

export function NewVerificationForm() {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestList, setRequestList] = useState<{
    items: PurchaseRequestOption[];
    error: string | null;
  } | null>(null);
  const [purchaseRequestNumber, setPurchaseRequestNumber] = useState("");
  const [purchaseRequestResult, setPurchaseRequestResult] = useState<{
    prNumber: string;
    data: PurchaseRequestResponse | null;
    error: string | null;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    listPurchaseRequests()
      .then((requests) => {
        if (active) {
          setRequestList({ items: requests, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRequestList({
            items: [],
            error:
              error instanceof Error
                ? error.message
                : "The purchase requests could not be loaded.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!purchaseRequestNumber) {
      return;
    }

    let active = true;

    getPurchaseRequest(purchaseRequestNumber)
      .then((data) => {
        if (active) {
          setPurchaseRequestResult({
            prNumber: purchaseRequestNumber,
            data,
            error: null,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPurchaseRequestResult({
            prNumber: purchaseRequestNumber,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "The purchase request could not be loaded.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [purchaseRequestNumber]);

  const purchaseRequests = requestList?.items ?? [];
  const isRequestListLoading = requestList === null;
  const requestListError = requestList?.error ?? null;

  const currentRequest =
    purchaseRequestResult?.prNumber === purchaseRequestNumber
      ? purchaseRequestResult
      : null;
  const isPurchaseRequestLoading =
    Boolean(purchaseRequestNumber) && currentRequest === null;
  const purchaseRequestData = currentRequest?.data ?? null;
  const purchaseRequestError = currentRequest?.error ?? null;

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

  const openFilePicker = useCallback(() => {
    if (!isSubmitting) {
      fileInputRef.current?.click();
    }
  }, [isSubmitting]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    setSubmitError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleStartVerification = useCallback(async () => {
    if (!selectedFile || !purchaseRequestNumber || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await uploadQuotationBatch(
        [selectedFile],
        purchaseRequestNumber
      );

      if (response.documents.length === 0) {
        setSubmitError(
          response.rejected_files[0]?.message ??
            "The quotation could not be accepted."
        );
        return;
      }

      router.push(`/verifications/${response.batch_id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The quotation could not be uploaded."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, purchaseRequestNumber, router, selectedFile]);

  const currentStep = selectedFile ? 2 : 1;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <span className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Step {currentStep} of 2
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a supplier quotation or contract to check it against your purchase
          request and company rules.
        </p>
      </header>

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              1
            </span>
            Supplier Document
          </CardTitle>
          <CardDescription>
            PDF files only. Max file size: 10MB
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

          {selectedFile ? (
            <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <FileText className="size-4 text-primary" />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)}
              </span>
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
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Choose a quotation PDF to upload"
              className={cn(
                "w-full cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
                isDragging
                  ? "border-primary bg-primary-light"
                  : "border-border bg-muted/30"
              )}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-light">
                  <FileUp className="size-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your document here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or browse files from your computer
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  <Plus className="size-4" />
                  Choose PDF
                </Button>
                <p className="text-xs text-muted-foreground">
                  PDF only, up to 10 MB.
                </p>
              </div>
            </div>
          )}

          {fileError && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {fileError}
            </div>
          )}

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

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              2
            </span>
            Purchase Request
          </CardTitle>
          <CardDescription>
            Select the request this quotation should be checked against.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="purchase-request"
          >
            Purchase request
          </label>
          <div className="relative w-full">
            <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="purchase-request"
              className="h-10 w-full appearance-none rounded-md border border-input bg-input/20 pl-10 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
              value={purchaseRequestNumber}
              onChange={(event) => setPurchaseRequestNumber(event.target.value)}
              disabled={isSubmitting || isRequestListLoading}
            >
              <option value="">
                {isRequestListLoading
                  ? "Loading purchase requests..."
                  : "Select a purchase request"}
              </option>
              {purchaseRequests.map((request) => (
                <option key={request.pr_number} value={request.pr_number}>
                  {requestOptionLabel(request)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {requestListError && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {requestListError}
            </div>
          )}

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

          <div className="flex justify-end border-t border-border pt-4">
            <Button
              type="button"
              onClick={handleStartVerification}
              disabled={!selectedFile || !purchaseRequestNumber || isSubmitting}
              className="min-w-44 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  Start Verification
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
