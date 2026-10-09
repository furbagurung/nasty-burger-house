"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DripMember, DripOverviewData } from "../types";

const PER_PAGE = 20;
const num = new Intl.NumberFormat("en-AU");
const STORE_TIME_ZONE = "Australia/Sydney";

function enrolmentDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: STORE_TIME_ZONE,
      }).format(d);
}

function formattedPoints(points: number | null) {
  return points === null ? "—" : num.format(points);
}

function MemberIdentity({ member }: { member: DripMember }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold text-foreground">{member.name || "Square member"}</p>
      <p className="break-all text-xs text-muted-foreground">
        {member.email || member.phone || `Square ID: ${member.squareCustomerId}`}
      </p>
    </div>
  );
}

export function AdminDripOverview({ data }: { data: DripOverviewData }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const members = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return data.members.filter((member) =>
      !needle || [
        member.name, member.email, member.phone, member.squareCustomerId,
      ].some((field) => field.toLocaleLowerCase().includes(needle)),
    );
  }, [data.members, query]);

  const pageCount = Math.max(1, Math.ceil(members.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visible = members.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Never report a partial total as an authoritative Square balance.
  const totalBalance = data.membersAvailable && data.members.every((member) => member.balance !== null)
    ? data.members.reduce((sum, member) => sum + (member.balance ?? 0), 0)
    : null;
  const totalLifetime = data.membersAvailable && data.members.every((member) => member.lifetimePoints !== null)
    ? data.members.reduce((sum, member) => sum + (member.lifetimePoints ?? 0), 0)
    : null;

  return (
    <div className="w-full max-w-6xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="admin-type-section text-foreground">Drip Points overview</h2>
          <p className="admin-type-body text-muted-foreground">
            Read-only Square Loyalty member balances and configured reward tiers.
          </p>
        </div>
        <Badge variant="secondary">Square Loyalty · Read only</Badge>
      </div>

      {(!data.membersAvailable || !data.program) && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>
            {!data.membersAvailable && !data.program
              ? "Square Loyalty information is temporarily unavailable. Check the Square connection and permissions."
              : !data.membersAvailable
                ? "Member balances could not be loaded from Square. No totals are displayed."
                : "Square reward program details are unavailable. Member balances are still shown."}
          </p>
        </div>
      )}

      <section aria-label="Square loyalty totals" className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-4 sm:divide-y-0">
        <div className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Square members</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{data.membersAvailable ? num.format(data.members.length) : "—"}</p>
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Available points</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{formattedPoints(totalBalance)}</p>
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Lifetime points</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{formattedPoints(totalLifetime)}</p>
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Reward tiers</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{data.program ? num.format(data.program.tiers.length) : "—"}</p>
        </div>
      </section>

      <section aria-labelledby="drip-rewards-title" className="space-y-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="drip-rewards-title" className="font-semibold text-foreground">Square reward program</h3>
          {data.program?.status && <Badge variant="outline">{data.program.status}</Badge>}
        </div>
        {data.program ? (
          data.program.tiers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.program.tiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                  <span className="min-w-0 text-sm font-medium text-foreground">
                    {tier.name ?? "Reward tier"}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {num.format(tier.points)} {data.program?.pointsLabel}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Square returned no configured reward tiers.</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Reward tiers could not be loaded.</p>
        )}
        <p className="text-xs text-muted-foreground">
          These are the actual Square reward tiers. Website promotional copy may use separate display rules.
        </p>
      </section>

      <section className="space-y-4" aria-labelledby="drip-members-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="drip-members-title" className="font-semibold text-foreground">Loyalty members</h3>
            <p className="text-xs text-muted-foreground">Balance and lifetime totals are supplied by Square.</p>
          </div>
          <Link href="/admin/customers" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View Customers <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="max-w-md space-y-1.5">
          <Label htmlFor="drip-member-search">Search members</Label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="drip-member-search" className="pl-9" value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Name, email, phone or customer ID"
              disabled={!data.membersAvailable}
            />
          </div>
        </div>
        {data.membersAvailable && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {visible.length ? (safePage - 1) * PER_PAGE + 1 : 0}–{(safePage - 1) * PER_PAGE + visible.length} of {members.length} members
          </p>
        )}

        {data.membersAvailable && members.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Lifetime</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell><MemberIdentity member={member} /></TableCell>
                      <TableCell className="text-sm">{member.phone || "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formattedPoints(member.balance)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formattedPoints(member.lifetimePoints)}</TableCell>
                      <TableCell className="text-sm">{enrolmentDate(member.enrolledAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2 md:hidden">
              {visible.map((member) => (
                <div key={member.id} className="space-y-3 rounded-lg border border-border bg-card p-3">
                  <MemberIdentity member={member} />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Available</p><p className="font-semibold tabular-nums">{formattedPoints(member.balance)}</p></div>
                    <div><p className="text-muted-foreground">Lifetime</p><p className="font-semibold tabular-nums">{formattedPoints(member.lifetimePoints)}</p></div>
                    <div><p className="text-muted-foreground">Enrolled</p><p>{enrolmentDate(member.enrolledAt)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {data.membersAvailable && members.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground" role="status">
            {query ? "No Square members match this search." : "No Square Loyalty members were returned."}
          </p>
        )}
        {data.membersAvailable && members.length > PER_PAGE && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Page {safePage} of {pageCount}</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ArrowLeft size={15} aria-hidden="true" /> Previous
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Next <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
