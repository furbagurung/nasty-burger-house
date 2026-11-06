"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadCurrentCustomer } from "../lib/customer-backend";
import { loadCustomerDripActivity } from "../lib/customer-drip-activity";
import type { CustomerProfile, DripLedgerEntry } from "../lib/customer-store";
import {
  DRIP_POINTS_PER_AUD,
  DRIP_REWARD_TARGET,
  DRIP_SIGNUP_BONUS,
  dripProgressPercent,
} from "../lib/loyalty";
import MobileBottomNav from "./mobile-bottom-nav";
import ButtonWithIcon from "@/components/ui/button-witn-icon";
import { ArrowRight, ChevronDown, Clock3, Gift, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SquareBalance = { balance: number; lifetimePoints: number | null };

async function loadSquareBalance(): Promise<SquareBalance | null> {
  try {
    const response = await fetch("/api/account/loyalty", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      ok?: boolean;
      source?: string;
      balance?: number;
      lifetimePoints?: number;
    };
    return data.ok && data.source === "square" && Number.isFinite(data.balance)
      ? {
          balance: Number(data.balance),
          lifetimePoints: Number.isFinite(data.lifetimePoints)
            ? Number(data.lifetimePoints)
            : null,
        }
      : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function DripPointsPage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [ledger, setLedger] = useState<DripLedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [squareLifetimePoints, setSquareLifetimePoints] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [customer, activity, square] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerDripActivity(),
          loadSquareBalance(),
        ]);

        if (!active) return;
        setProfile(customer);
        setLedger(activity.entries);
        // Square is the source of truth for current loyalty points.
        // The Supabase ledger still records website order history.
        setBalance(square?.balance ?? activity.balance);
        setSquareLifetimePoints(square?.lifetimePoints ?? null);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load Drip Points.",
        );
      } finally {
        if (active) setReady(true);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const progress = useMemo(() => dripProgressPercent(balance), [balance]);
  const remaining = Math.max(0, DRIP_REWARD_TARGET - balance);

  const pendingPoints = useMemo(
    () =>
      ledger.reduce(
        (total, entry) =>
          entry.status === "pending"
            ? total + Math.max(0, Number(entry.points || 0))
            : total,
        0,
      ),
    [ledger],
  );

  const earnedPoints = useMemo(
    () =>
      squareLifetimePoints ??
      ledger.reduce(
        (total, entry) =>
          entry.points > 0 && entry.status !== "void"
            ? total + entry.points
            : total,
        0,
      ),
    [ledger, squareLifetimePoints],
  );

  const redeemedPoints = useMemo(
    () =>
      Math.abs(
        ledger.reduce(
          (total, entry) =>
            entry.points < 0 && entry.status !== "void"
              ? total + entry.points
              : total,
          0,
        ),
      ),
    [ledger],
  );

  const visibleLedger = showAllActivity ? ledger : ledger.slice(0, 3);

  return (
    <div className="standalone-page drip-page drip-page--dashboard-v2">
      <main className="standalone-main drip-page-main">
        {!ready ? (
          <div className="cart-page-loading">Loading Drip Points…</div>
        ) : !profile ? (
          <>
            <section className="drip-page-hero">
              <div className="drip-page-hero__copy">
                <p className="standalone-eyebrow">Nasty Rewards</p>
                <h1>Get Nasty. Earn Drip Points. Eat Free.</h1>
                <p>
                  New Square Loyalty members can get {DRIP_SIGNUP_BONUS} welcome points
                  and earn {DRIP_POINTS_PER_AUD} points for every A$1 of eligible
                  order value.
                </p>
                <div className="drip-page-hero__stat">
                  <strong>{DRIP_SIGNUP_BONUS}</strong>
                  <span>Welcome points for new members</span>
                </div>
              </div>

              <div className="drip-page-hero__art" aria-hidden="true">
                <span className="drip-page-hero__glow" />
                <Image
                  src="/images/drip-points/drip-coin.png"
                  alt=""
                  width={620}
                  height={620}
                  priority
                />
              </div>
            </section>

            <section
              className="drip-page-benefits"
              aria-labelledby="drip-benefits-title"
            >
              <div className="drip-page-benefits__heading">
                <p className="standalone-eyebrow">How Drip Points work</p>
                <h2 id="drip-benefits-title">Earn safely. Unlock after pickup.</h2>
              </div>

              <div className="drip-page-benefit-grid">
                <article>
                  <span>01</span>
                  <strong>Join +{DRIP_SIGNUP_BONUS}</strong>
                  <p>New Square Loyalty members receive one welcome bonus; existing members keep their balance.</p>
                </article>
                <article>
                  <span>02</span>
                  <strong>{DRIP_POINTS_PER_AUD} points / A$1</strong>
                  <p>Order points are created as pending from the validated server subtotal.</p>
                </article>
                <article>
                  <span>03</span>
                  <strong>Complete the order</strong>
                  <p>Pending points become available when the team marks the pickup completed.</p>
                </article>
              </div>
            </section>

            <section className="drip-page-signup" aria-labelledby="drip-signup-title">
              <div className="drip-page-signup__copy">
                <p className="standalone-eyebrow">Join Drip Points</p>
                <h2 id="drip-signup-title">
                  New loyalty members get {DRIP_SIGNUP_BONUS} welcome points.
                </h2>
              </div>
              <div className="drip-page-success">
                <Image
                  src="/images/drip-points/drip-coin.png"
                  alt=""
                  width={90}
                  height={90}
                />
                <strong>{DRIP_SIGNUP_BONUS} welcome points</strong>
                <span>Existing Square members keep their points when they link their website account.</span>
                <ButtonWithIcon
                  href="/account/create?return=/drip-points"
                  tone="red"
                >
                  Create account
                </ButtonWithIcon>
                <Link
                  className="standalone-secondary-link"
                  href="/account/sign-in?return=/drip-points"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </section>
          </>
        ) : (
          <>
            {error && (
              <div className="account-inline-notice" role="alert">
                <span>{error}</span>
              </div>
            )}

            <section className="drip-wallet" aria-labelledby="drip-wallet-title">
              <header className="drip-wallet__header">
                <div>
                  <h1 id="drip-wallet-title">My Drip Points</h1>
                  <p>Your rewards wallet</p>
                </div>
                <Link className="drip-wallet__account-link" href="/account">
                  Account <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </header>

              <div className="drip-wallet__grid">
                <section className="drip-wallet__balance" aria-label={"Drip Points balance for " + profile.name}>
                  <div className="drip-wallet__balance-top">
                    <div>
                      <p className="drip-wallet__balance-label">Available balance</p>
                      <div className="drip-wallet__amount">
                        <strong>{balance.toLocaleString()}</strong>
                        <span>points</span>
                      </div>
                    </div>
                    <Image
                      className="drip-wallet__coin"
                      src="/images/drip-points/drip-coin.png"
                      alt="Nasty Burger House Drip Points gold coin"
                      width={86}
                      height={86}
                      priority
                    />
                  </div>

                  <div className="drip-wallet__balance-goal">
                    <div className="drip-wallet__goal-heading">
                      <span>Free Beast Burger Meal</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div
                      className="drip-wallet__meter"
                      role="progressbar"
                      aria-label="Progress toward the 2,000 point reward goal"
                      aria-valuemin={0}
                      aria-valuemax={DRIP_REWARD_TARGET}
                      aria-valuenow={Math.min(Math.max(0, balance), DRIP_REWARD_TARGET)}
                    >
                      <span style={{ width: progress + "%" }} />
                    </div>
                    <div className="drip-wallet__goal-footer">
                      <p>
                        {remaining === 0
                          ? "Reward goal reached — ask our team about in-store redemption."
                          : "Just " + remaining.toLocaleString() + " points to reach your reward goal."}
                      </p>
                      <a href="#drip-rewards">View reward <ArrowRight size={14} aria-hidden="true" /></a>
                    </div>
                  </div>

                  <div className="drip-wallet__balance-meta">
                    <span>{squareLifetimePoints !== null ? "Balance from Square Loyalty" : "Website points balance"}</span>
                    {pendingPoints > 0 && <span><Clock3 size={14} aria-hidden="true" /> {pendingPoints.toLocaleString()} pending</span>}
                  </div>
                </section>

                <Card className="drip-wallet__stats drip-wallet__card" aria-label="Drip Points totals">
                  <CardContent className="drip-wallet__stats-content">
                    <div className="drip-wallet__stat">
                      <span className="drip-wallet__stat-label"><TrendingUp size={18} aria-hidden="true" /> Earned</span>
                      <strong>{earnedPoints.toLocaleString()}</strong>
                    </div>
                    <div className="drip-wallet__stat">
                      <span className="drip-wallet__stat-label"><Gift size={18} aria-hidden="true" /> Redeemed</span>
                      <strong>{redeemedPoints.toLocaleString()}</strong>
                    </div>
                  </CardContent>
                </Card>

                <Card className="drip-wallet__history drip-wallet__card">
                  <CardContent>
                    <div className="drip-wallet__card-heading">
                      <div>
                        <h2>Points activity</h2>
                        <p>Website orders and bonuses</p>
                      </div>
                      {ledger.length > 3 && (
                        <Button
                          className="drip-wallet__view-all"
                          variant="ghost"
                          type="button"
                          aria-expanded={showAllActivity}
                          onClick={() => setShowAllActivity((current) => !current)}
                        >
                          {showAllActivity ? "Show less" : "View all"}
                        </Button>
                      )}
                    </div>
                    {ledger.length === 0 ? (
                      <div className="drip-wallet__empty">
                        <Gift size={22} aria-hidden="true" />
                        <p>No website points activity yet. Your eligible orders will appear here.</p>
                      </div>
                    ) : (
                      <ul className="drip-wallet__activity-list">
                        {visibleLedger.map((entry) => (
                          <li className="drip-wallet__activity" key={entry.id}>
                            <span className="drip-wallet__activity-icon" aria-hidden="true">
                              {entry.type === "signup" || entry.type === "redeem"
                                ? <Gift size={19} />
                                : <ShoppingBag size={19} />}
                            </span>
                            <div className="drip-wallet__activity-copy">
                              <strong>{entry.description}</strong>
                              <span>
                                {formatDate(entry.createdAt)}
                                {entry.orderId ? " · " + entry.orderId : ""}
                              </span>
                              {entry.status && entry.status !== "available" && (
                                <span className="drip-wallet__activity-status">{entry.status}</span>
                              )}
                            </div>
                            <strong
                              className={
                                "drip-wallet__activity-points " +
                                (entry.status === "void"
                                  ? "is-void"
                                  : entry.status === "pending"
                                    ? "is-pending"
                                    : entry.points >= 0
                                      ? "is-positive"
                                      : "is-negative")
                              }
                            >
                              {entry.points >= 0 ? "+" : ""}{entry.points.toLocaleString()}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                    {squareLifetimePoints !== null && (
                      <p className="drip-wallet__source-note">
                        Your Square balance can also include in-store activity not listed here.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card id="drip-rewards" className="drip-wallet__reward drip-wallet__card">
                  <CardContent>
                    <div className="drip-wallet__reward-top">
                      <span className="drip-wallet__reward-icon"><Gift size={23} aria-hidden="true" /></span>
                      <div>
                        <p className="drip-wallet__reward-kicker">Your next reward</p>
                        <h2>Free Beast Burger Meal</h2>
                        <p>Reward goal: {DRIP_REWARD_TARGET.toLocaleString()} available points</p>
                      </div>
                    </div>
                    <p className="drip-wallet__reward-summary">
                      {remaining === 0
                        ? "You've reached the points target. Ask the team to confirm in-store redemption."
                        : "Earn " + remaining.toLocaleString() + " more points to reach the target."}
                    </p>
                    <p className="drip-wallet__reward-fineprint">
                      Online redemption is not available yet. Reward eligibility is confirmed in-store.
                    </p>
                    <Link className="drip-wallet__reward-link" href="/menu/burgers">
                      Explore menu <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>

                <Card className="drip-wallet__earn drip-wallet__card">
                  <CardContent>
                    <div className="drip-wallet__earn-copy">
                      <h2>Earn more Drip Points</h2>
                      <p>Get {DRIP_POINTS_PER_AUD} points for every A$1 of eligible order value.</p>
                      <Link href="/menu/burgers">
                        Order from the menu <ArrowRight size={17} aria-hidden="true" />
                      </Link>
                    </div>
                    <Image
                      src="/images/drip-points/drip-coin.png"
                      alt=""
                      width={94}
                      height={94}
                      aria-hidden="true"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </div>

              <details className="drip-wallet__details" id="drip-how-it-works">
                <summary>
                  How Drip Points work <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <ul>
                  <li>New Square Loyalty members receive {DRIP_SIGNUP_BONUS} welcome points once.</li>
                  <li>Earn {DRIP_POINTS_PER_AUD} points for every A$1 of eligible order value.</li>
                  <li>Website order points become available after completed pickup.</li>
                  <li>Reward redemption is confirmed in-store. Online redemption is not yet enabled.</li>
                </ul>
              </details>
            </section>
          </>
        )}
      </main>
      <MobileBottomNav active="drip" />
    </div>
  );
}
