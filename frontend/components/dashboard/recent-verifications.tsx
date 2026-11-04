import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRecentVerifications } from "@/lib/mock-data";

const statusStyles = {
  Approved: "bg-success/10 text-success",
  Rejected: "bg-danger/10 text-danger",
  "Needs Human Review": "bg-warning/10 text-warning",
} as const;

export function RecentVerifications() {
  return (
    <Card className="rounded-xl border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Verifications
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest supplier quotation verification activity.
          </p>
        </div>
        <Link
          href="/verifications"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          View all
        </Link>
      </CardHeader>

      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Purchase Request</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentVerifications.map((verification) => (
                <tr
                  key={verification.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {verification.supplier}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {verification.purchaseRequest}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(verification.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        statusStyles[verification.status],
                      )}
                    >
                      {verification.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href="/verifications"
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
