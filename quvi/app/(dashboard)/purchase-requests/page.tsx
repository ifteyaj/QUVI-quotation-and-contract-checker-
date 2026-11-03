import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PurchaseRequestsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Purchase Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          View purchase requests available for quotation matching.
        </p>
      </header>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Purchase Requests
          </CardTitle>
          <CardDescription>
            Purchase request integration is planned for a later step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This route is active so sidebar navigation remains functional.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
