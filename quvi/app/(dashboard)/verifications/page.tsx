import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerificationsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verification List
        </h1>
        <p className="text-sm text-muted-foreground">
          Track supplier quotation verification results.
        </p>
      </header>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Verifications
          </CardTitle>
          <CardDescription>
            Connected verification data will be added in a later step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This screen is ready for integration with the QUVI backend.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
