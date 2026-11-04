import { Suspense } from "react";

import VerificationResultView from "@/components/verifications/verification-result-view";

async function VerificationResultContent({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  return <VerificationResultView batchId={batchId} />;
}

export default function VerificationResultRoute({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-muted-foreground">Loading verification...</p>
      }
    >
      <VerificationResultContent params={params} />
    </Suspense>
  );
}
