"use client";

import { useEffect, useState } from "react";
import { getPolicyRules } from "@/lib/api";
import type { PolicyRuleGroupResponse } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function RulesPolicyPage() {
  const [rules, setRules] = useState<PolicyRuleGroupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getPolicyRules()
      .then((data) => {
        if (active) setRules(data);
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Rules could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Rules &amp; Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Exact company rules enforced by the deterministic backend.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : loading || !rules ? (
        <p className="text-sm text-muted-foreground">Loading rules...</p>
      ) : (
        <div className="space-y-6">
          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Approval condition</CardTitle>
              <CardDescription>{rules.approval}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Reject rules
              </CardTitle>
              <CardDescription>
                A single confirmed reject condition gives the overall result REJECT.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-foreground">
                {rules.reject_rules.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-danger" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Human-review rules
              </CardTitle>
              <CardDescription>
                Without a reject condition, any of these gives NEEDS_HUMAN_REVIEW.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-foreground">
                {rules.review_rules.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-warning" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Additional notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {rules.notes.map((rule) => (
                  <li key={rule}>• {rule}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Rule version: {rules.rule_version}. Source: {rules.source}.
          </p>
        </div>
      )}
    </section>
  );
}
