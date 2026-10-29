"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getBrowserClientOrNull } from "../lib/supabase/client";

type RewardOption = { id: string; name: string; points: number; eligible: boolean };
type RewardsResponse = {
  ok: boolean;
  enabled: boolean;
  authenticated?: boolean;
  needsPhoneVerification?: boolean;
  reason?: string | null;
  balance?: number | null;
  tiers: RewardOption[];
};

function normalisePhone(phone: string) {
  const compact = phone.trim().replace(/[()\s-]/g, "");
  if (compact.startsWith("+61")) return compact;
  if (/^04\d{8}$/.test(compact)) return "+61" + compact.slice(1);
  return compact;
}

function VerifyMobile({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [number, setNumber] = useState(normalisePhone(phone));
  const [otp, setOtp] = useState("");
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function requestCode() {
    const supabase = getBrowserClientOrNull();
    if (!supabase) { setNotice("Account verification is temporarily unavailable."); return; }
    const validated = normalisePhone(number);
    if (!/^\+614\d{8}$/.test(validated)) { setNotice("Enter a valid Australian mobile number."); return; }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.updateUser({ phone: validated });
      if (error) throw error;
      setNumber(validated);
      setRequested(true);
      setNotice("A verification code was sent by SMS.");
    } catch (error) {
      // Never expose internal Supabase provider configuration errors to buyers.
      const message = error instanceof Error ? error.message : "";
      if (/sms provider|phone provider|phone_provider_disabled|provider.*disabled/i.test(message)) {
        setNotice("SMS verification is unavailable right now. Please continue without a reward or redeem in-store.");
      } else if (/rate limit|too many requests|over_email_send_rate_limit/i.test(message)) {
        setNotice("Too many verification attempts. Please try again later.");
      } else {
        setNotice("We couldn't send a verification code. Please try again later or continue without a reward.");
      }
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    const supabase = getBrowserClientOrNull();
    if (!supabase) return;
    if (!/^\d{6}$/.test(otp.trim())) { setNotice("Enter the six-digit SMS code."); return; }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: number, token: otp.trim(), type: "phone_change",
      });
      if (error) throw error;
      onVerified();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/expired|invalid|token/i.test(message)) {
        setNotice("That code is incorrect or expired. Please check it and try again.");
      } else {
        setNotice("We couldn't verify your mobile number right now. You can continue without a reward or redeem in-store.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <Label htmlFor="reward-verify-phone">Verify mobile number</Label>
      <Input id="reward-verify-phone" type="tel" autoComplete="tel" value={number}
        disabled={busy || requested} onChange={(event) => setNumber(event.target.value)}
        placeholder="+614XXXXXXXX" />
      {requested && (
        <>
          <Label htmlFor="reward-otp">SMS code</Label>
          <Input id="reward-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} value={otp} disabled={busy}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code" />
          <Button type="button" variant="outline" disabled={busy} onClick={verifyCode}>
            {busy ? "Verifying…" : "Verify mobile"}
          </Button>
        </>
      )}
      {!requested && (
        <Button type="button" variant="outline" disabled={busy} onClick={requestCode}>
          {busy ? "Sending…" : "Send SMS code"}
        </Button>
      )}
      {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
    </div>
  );
}

export default function CheckoutRewardPicker({
  selectedId, onSelect, phone, disabled,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  phone: string;
  disabled: boolean;
}) {
  const [response, setResponse] = useState<RewardsResponse | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const result = await fetch("/api/account/rewards", { cache: "no-store" });
        const data = (await result.json()) as RewardsResponse;
        if (alive) setResponse(data);
      } catch {
        if (alive) setResponse({
          ok: false, enabled: false, tiers: [],
          reason: "Cannot load Square rewards right now.",
        });
      }
    })();
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    if (!response?.enabled && selectedId) onSelect("");
  }, [onSelect, response?.enabled, selectedId]);

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-3 py-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Redeem Drip Points</h3>
          <p className="text-sm text-muted-foreground">
            Rewards and point balances are managed by Square, including in-store purchases.
          </p>
        </div>
        {!response ? (
          <p className="text-sm text-muted-foreground" role="status">Checking Square Loyalty…</p>
        ) : (
          <>
            {typeof response.balance === "number" && (
              <p className="text-sm font-medium text-foreground">
                {response.balance.toLocaleString()} available points
              </p>
            )}
            {response.enabled && response.tiers.length > 0 && (
              <div role="group" aria-label="Choose a Square Loyalty reward" className="space-y-2">
                <button type="button" disabled={disabled} aria-pressed={selectedId === ""}
                  onClick={() => onSelect("")}
                  className={"w-full rounded-lg border px-4 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
                    (selectedId === "" ? "border-primary bg-muted text-foreground" : "border-border text-foreground")}>
                  No reward — earn points from this order
                </button>
                {response.tiers.map((tier) => (
                  <button type="button" key={tier.id} disabled={disabled || !tier.eligible}
                    aria-pressed={selectedId === tier.id} onClick={() => onSelect(tier.id)}
                    className={"w-full rounded-lg border px-4 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 " +
                      (selectedId === tier.id ? "border-primary bg-muted text-foreground" : "border-border text-foreground")}>
                    <span className="block font-semibold">{tier.name}</span>
                    <span className="text-muted-foreground">
                      {tier.points.toLocaleString()} points{tier.eligible ? "" : " · Not enough points"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {response.reason && (
              <p className="text-sm text-muted-foreground" role="status">{response.reason}</p>
            )}
            {response.needsPhoneVerification && (
              <VerifyMobile phone={phone} onVerified={() => setRefresh((value) => value + 1)} />
            )}
            {response.authenticated === false && (
              <Link className="text-sm font-semibold underline" href="/account/sign-in?return=/checkout">
                Sign in to view rewards
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
