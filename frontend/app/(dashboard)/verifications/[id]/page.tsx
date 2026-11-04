import { Suspense } from "react";

import VerificationDetailView from "@/components/verifications/verification-detail-view";

export default async function VerificationDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading verification...</p>}>
      <VerificationDetailView id={id} />
    </Suspense>
  );
}
