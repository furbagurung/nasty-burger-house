"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { MailCheck, MailPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Alias = { email: string; verified: boolean; pending: boolean };

export default function AccountEmailAddresses() {
  const [primary, setPrimary] = useState("");
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account/email-addresses", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Could not load your email addresses.");
      setPrimary(result.primary);
      setAliases(result.aliases);
    } catch {
      setError("Could not load your email addresses.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function addEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setWorking(true);
    try {
      const response = await fetch("/api/account/email-addresses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not send verification email.");
      setEmail(""); setMessage(result.message || "Check your inbox to verify.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification email.");
    } finally { setWorking(false); }
  }

  async function removeEmail(address: string) {
    setError(""); setMessage(""); setWorking(true);
    try {
      const response = await fetch("/api/account/email-addresses", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not remove email.");
      setMessage("Additional email removed.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove email.");
    } finally { setWorking(false); }
  }

  return (
    <Card className="border-border bg-card text-card-foreground" aria-labelledby="linked-emails-heading">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-1 size-5 shrink-0 text-foreground" aria-hidden="true" />
          <div>
            <h2 id="linked-emails-heading" className="font-semibold">Email addresses</h2>
            <p className="text-sm text-muted-foreground">Use any verified address with your account password to sign in. All addresses access the same orders and Drip Points.</p>
          </div>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">Loading email addresses…</p> : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
              <span className="min-w-0 break-all text-sm">{primary}</span>
              <span className="text-xs font-medium text-muted-foreground">Primary</span>
            </div>
            {aliases.map((alias) => (
              <div key={alias.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="break-all text-sm">{alias.email}</p>
                  <p className="text-xs text-muted-foreground">{alias.verified ? "Verified · Can sign in" : alias.pending ? "Pending verification" : "Verification expired — add again"}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" disabled={working} onClick={() => void removeEmail(alias.email)} aria-label={`Remove ${alias.email}`}>
                  <Trash2 className="size-4" aria-hidden="true" /> Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addEmail} className="space-y-2">
          <Label htmlFor="additional-account-email">Additional email</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="additional-account-email" type="email" autoComplete="email" maxLength={160}
              placeholder="another@example.com" value={email} onChange={(event) => setEmail(event.target.value)}
              disabled={working} required className="min-w-0 flex-1" />
            <Button type="submit" disabled={working || loading || !email.trim()}>
              <MailPlus className="size-4" aria-hidden="true" />
              {working ? "Working…" : "Send verification"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Up to three additional emails. Verification links expire after one hour. Password reset emails go to the primary address.</p>
        </form>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        {message && <p className="text-sm text-foreground" role="status">{message}</p>}
      </CardContent>
    </Card>
  );
}
