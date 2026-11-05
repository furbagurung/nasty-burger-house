"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { LoyaltyAudit, LoyaltyAuditRow } from "@/app/lib/admin-loyalty-reconciliation";

type StatusFilter = "all" | "different" | "review" | "same" | "unmatched";

function label(status: LoyaltyAuditRow["status"]) {
  switch (status) {
    case "different": return "Different balances";
    case "same": return "Equal balances";
    case "review": return "Needs identity review";
    case "website-only": return "Website only";
    case "square-only": return "Square only";
    case "unavailable": return "Square unavailable";
  }
}

function points(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-AU");
}

export default function LoyaltyReconciliationView({ audit }: { audit: LoyaltyAudit }) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audit.rows.filter((row) => {
      if (filter === "different" && row.status !== "different") return false;
      if (filter === "review" && row.status !== "review") return false;
      if (filter === "same" && row.status !== "same") return false;
      if (filter === "unmatched" && !["website-only", "square-only", "unavailable"].includes(row.status)) return false;
      return !q || [
        row.name, row.websiteEmail, row.squareEmail, row.phone,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [audit.rows, filter, search]);

  return (
    <main className="admin-main space-y-5 px-4 py-5 sm:px-6" aria-label="Square and Drip Points reconciliation">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-foreground underline underline-offset-4">
            <ArrowLeft className="size-4" aria-hidden="true" /> Customers
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Drip Points reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Read-only comparison with Square Loyalty · Checked {new Date(audit.checkedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <Link href="/admin/customers/loyalty-audit" className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <RefreshCw className="size-4" aria-hidden="true" /> Refresh report
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          ["Website profiles", audit.websiteCount],
          ["Square loyalty accounts", audit.squareCount ?? "Unavailable"],
          ["Different balances (verified)", audit.differentCount],
          ["Identity review", audit.reviewCount],
        ] as const).map(([heading, value]) => (
          <Card key={heading} className="border-border bg-card text-card-foreground">
            <CardContent className="space-y-1 p-4">
              <p className="text-sm text-muted-foreground">{heading}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-semibold">How to interpret this report</p>
          <p className="text-muted-foreground">
            Square Loyalty is the authoritative available Drip Points balance. The website ledger
            retains historic entries, so different balances are not automatically errors or a
            reason to add or subtract points. Pending/void website points are excluded.
          </p>
          <p className="text-muted-foreground">
            Only a unique, verified email match is used for numeric comparison. Shared phone numbers
            and similar names are possible matches requiring identity verification. This report
            never merges customer accounts, changes credentials, or adjusts points.
          </p>
          {audit.squareError && <p className="text-destructive" role="alert">{audit.squareError}</p>}
        </CardContent>
      </Card>

      {audit.duplicatePhones.length > 0 && (
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader><CardTitle className="text-base">Duplicate website phone numbers needing review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {audit.duplicatePhones.map((group) => (
              <section key={group.phone} className="rounded-lg border border-border p-3" aria-label={`Phone ${group.phone}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{group.phone}</strong>
                  <Badge variant="outline">{group.profiles.length} separate login accounts</Badge>
                </div>
                <div className="mt-2 space-y-2">
                  {group.profiles.map((profile) => (
                    <p key={profile.id} className="break-words text-sm text-foreground">
                      <span className="font-medium">{profile.name}</span> · {profile.email} · {points(profile.websitePoints)} website points ·{" "}
                      <span className="text-muted-foreground">{profile.confirmed ? "Email confirmed" : "Email not confirmed"}</span>
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Do not add the signup bonuses together or merge accounts based only on this number.
                </p>
              </section>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">All customer balances and potential mismatches</CardTitle>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reconciliation results">
            {([
              ["all", "All"],
              ["different", "Differences"],
              ["review", "Review"],
              ["same", "Equal"],
              ["unmatched", "Unmatched"],
            ] as const).map(([key, title]) => (
              <Button size="sm" type="button" key={key} variant={filter === key ? "default" : "outline"}
                aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {title}
              </Button>
            ))}
          </div>
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" aria-label="Search loyalty customer balances"
              placeholder="Search name, email or phone" value={search} onChange={(event) => setSearch(event.target.value)}
              className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground" role="status">Showing {filtered.length} of {audit.rows.length} records</p>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[890px]">
              <TableHeader><TableRow>
                <TableHead scope="col">Customer</TableHead>
                <TableHead scope="col">Phone</TableHead>
                <TableHead scope="col" className="text-right">Website available</TableHead>
                <TableHead scope="col" className="text-right">Square available</TableHead>
                <TableHead scope="col" className="text-right">Difference</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-64 whitespace-normal">
                      <p className="font-medium">{row.name}</p>
                      {row.websiteEmail && <p className="break-all text-xs text-muted-foreground">{row.websiteEmail}</p>}
                      {row.squareEmail && row.squareEmail !== row.websiteEmail &&
                        <p className="break-all text-xs text-muted-foreground">Square: {row.squareEmail}</p>}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.phone || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{points(row.websitePoints)}</TableCell>
                    <TableCell className="text-right tabular-nums">{points(row.squarePoints)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.difference === null ? "—" :
                      `${row.difference > 0 ? "+" : ""}${points(row.difference)}`}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      <Badge variant={row.status === "different" ? "destructive" : "outline"}>{label(row.status)}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{row.explanation}</p>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No customers match this filter.
                </TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
