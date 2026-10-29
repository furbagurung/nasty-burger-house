"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gift, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getBrowserClientOrNull } from "../lib/supabase/client";
import { DRIP_REWARD_TARGET, dripProgressPercent } from "../lib/loyalty";

type RewardOption = { id: string; name: string; points: number; eligible: boolean };
type SquareBalanceResponse = { ok?: boolean; source?: "square" | "website"; balance?: number; enrolled?: boolean };
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
  const [squareBalance, setSquareBalance] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // Square is the only spendable loyalty balance. Never present the
      // website ledger fallback as a confirmed Square balance.
      const [rewardsResult, loyaltyResult] = await Promise.allSettled([
        fetch("/api/account/rewards", { cache: "no-store" }),
        fetch("/api/account/loyalty", { cache: "no-store" }),
      ]);
      if (!alive) return;
      if (rewardsResult.status === "fulfilled" && rewardsResult.value.ok) {
        try {
          setResponse((await rewardsResult.value.json()) as RewardsResponse);
        } catch {
          setResponse({ ok: false, enabled: false, tiers: [] });
        }
      } else {
        setResponse({ ok: false, enabled: false, tiers: [] });
      }
      if (loyaltyResult.status === "fulfilled" && loyaltyResult.value.ok) {
        try {
          const loyalty = (await loyaltyResult.value.json()) as SquareBalanceResponse;
          if (alive && loyalty.ok && loyalty.source === "square" &&
              loyalty.enrolled && typeof loyalty.balance === "number" &&
              Number.isFinite(loyalty.balance)) {
            setSquareBalance(Math.max(0, loyalty.balance));
          } else if (alive) {
            setSquareBalance(null);
          }
        } catch {
          if (alive) setSquareBalance(null);
        }
      } else if (alive) {
        setSquareBalance(null);
      }
    })();
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    if (!response?.enabled && selectedId) onSelect("");
  }, [onSelect, response?.enabled, selectedId]);

  const progress = squareBalance === null ? 0 : dripProgressPercent(squareBalance);
  const available = squareBalance === null ? 0 : Math.min(squareBalance, DRIP_REWARD_TARGET);
  const canRedeemOnline = response?.enabled === true;

  return (
    <Card className="checkout-loyalty" aria-label="Drip Points at checkout">
      <CardContent className="checkout-loyalty__content">
        <div className="checkout-loyalty__hero">
          <div>
            <span className="checkout-loyalty__eyebrow">Nasty Rewards</span>
            <h3>Drip Points</h3>
            <p>Earn on every order.</p>
          </div>
          <Image
            src="/images/drip-points/drip-coin.png"
            alt=""
            width={108}
            height={108}
            className="checkout-loyalty__coin"
          />
        </div>

        {squareBalance !== null ? (
          <>
            <div className="checkout-loyalty__balance-row">
              <div>
                <span className="checkout-loyalty__label">Your Square balance</span>
                <div className="checkout-loyalty__balance">
                  <strong>{squareBalance.toLocaleString()}</strong> <span>pts</span>
                </div>
              </div>
              <span className="checkout-loyalty__synced">
                <Check size={14} aria-hidden="true" /> Square synced
              </span>
            </div>
            <div className="checkout-loyalty__goal">
              <Image
                src="/images/signature-beast.webp"
                alt=""
                width={82}
                height={82}
                className="checkout-loyalty__reward-image"
              />
              <div className="checkout-loyalty__goal-copy">
                <div className="checkout-loyalty__goal-heading">
                  <strong>Free Beast Burger Meal goal</strong>
                  <span>{DRIP_REWARD_TARGET.toLocaleString()} pts</span>
                </div>
                <div
                  className="checkout-loyalty__track"
                  role="progressbar"
                  aria-label="Drip Points progress toward the reward goal"
                  aria-valuemin={0}
                  aria-valuemax={DRIP_REWARD_TARGET}
                  aria-valuenow={available}
                >
                  <span style={{ width: progress + "%" }} />
                </div>
                <small>
                  {squareBalance >= DRIP_REWARD_TARGET
                    ? "Goal reached — ask in-store about eligible rewards"
                    : available.toLocaleString() + " / " + DRIP_REWARD_TARGET.toLocaleString() + " pts"}
                </small>
              </div>
            </div>
          </>
        ) : (
          <div className="checkout-loyalty__earn">
            <span className="checkout-loyalty__earn-icon"><Gift size={19} aria-hidden="true" /></span>
            <div>
              <strong>Your next order earns Drip Points</strong>
              <p>Track your rewards in My Account.</p>
            </div>
          </div>
        )}

        {canRedeemOnline && response && response.tiers.length > 0 && (
          <div className="checkout-loyalty__options" role="group" aria-label="Choose a Square Loyalty reward">
            <button
              type="button"
              className="checkout-loyalty__option"
              disabled={disabled}
              aria-pressed={selectedId === ""}
              onClick={() => onSelect("")}
            >No reward — keep earning points</button>
            {response.tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                className="checkout-loyalty__option"
                disabled={disabled || !tier.eligible}
                aria-pressed={selectedId === tier.id}
                onClick={() => onSelect(tier.id)}
              >
                <span>{tier.name}</span>
                <small>{tier.points.toLocaleString()} pts{!tier.eligible ? " · Not enough points" : ""}</small>
              </button>
            ))}
          </div>
        )}

        <div className="checkout-loyalty__footer">
          <div className="checkout-loyalty__status">
            <Store size={18} aria-hidden="true" />
            <span>{canRedeemOnline ? "Choose a reward before paying" : "Redeem in-store for now"}</span>
          </div>
          <Link href="/account/drip-points" className="checkout-loyalty__link">
            View rewards <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {response?.enabled && response.needsPhoneVerification && (
          <VerifyMobile phone={phone} onVerified={() => setRefresh((value) => value + 1)} />
        )}
        {response?.enabled && response.authenticated === false && (
          <Link className="checkout-loyalty__sign-in" href="/account/sign-in?return=/checkout">
            Sign in to redeem
          </Link>
        )}
        {response?.enabled && response.reason && (
          <p className="checkout-loyalty__notice" role="status">{response.reason}</p>
        )}
      </CardContent>
    </Card>
  );
}
