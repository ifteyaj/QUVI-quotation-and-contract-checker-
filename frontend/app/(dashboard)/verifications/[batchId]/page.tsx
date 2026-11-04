import { Suspense } from "react";

import VerificationResultView from "@/components/verifications/verification-result-view";

export default async function VerificationResultRoute({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-muted-foreground">Loading verification...</p>
      }
    >
      <VerificationResultView batchId={batchId} />
    </Suspense>
  );
}
