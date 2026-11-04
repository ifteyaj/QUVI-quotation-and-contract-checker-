"use client";

import { useEffect, useState } from "react";
import { listBatches } from "@/lib/api";
import { getPurchaseRequest } from "@/lib/api";
import { getPolicyRules } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [health, setHealth] = useState("Unknown");

  const [requestCount, setRequestCount] = useState(0);
  const [ruleVersion, setRuleVersion] = useState("Unavailable");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

    Promise.all([fetch(`${apiBaseUrl}/health`), getPurchaseRequest("PR-2026-114"), getPolicyRules(), listBatches()])
      .then(async ([healthResponse, pr, rules]) => {
        if (!active) return;
        const healthJson = await healthResponse.json();
        setHealth(healthJson.status ?? "Unknown");
        setRequestCount(pr.items.length);
        setRuleVersion(rules.rule_version);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Settings could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          System information only. This prototype has no user-configurable settings.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Backend</CardTitle>
              <CardDescription>FastAPI connection.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {health}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Purchase Requests
              </CardTitle>
              <CardDescription>Items available in PR-2026-114.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {requestCount}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Rule Version
              </CardTitle>
              <CardDescription>Policy version used for verification.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ruleVersion}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
