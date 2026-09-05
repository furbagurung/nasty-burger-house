"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  dripBalance,
  ensureSignupBonus,
  readDripLedger,
  readSignedInCustomerProfile,
  type CustomerProfile,
  type DripLedgerEntry,
} from "../lib/customer-store";
import {
  DRIP_POINTS_PER_AUD,
  DRIP_REWARD_TARGET,
  DRIP_SIGNUP_BONUS,
  dripProgressPercent,
} from "../lib/loyalty";
import MobileBottomNav from "./mobile-bottom-nav";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = readSignedInCustomerProfile();
    if (current) ensureSignupBonus();
    setProfile(current);
    setLedger(readDripLedger());
    setReady(true);
  }, []);

  const balance = useMemo(() => dripBalance(ledger), [ledger]);
  const progress = useMemo(() => dripProgressPercent(balance), [balance]);
  const remaining = Math.max(0, DRIP_REWARD_TARGET - balance);

  return (
    <div className="standalone-page drip-page">
      <main className="standalone-main drip-page-main">
        <section className="drip-page-hero">
          <div className="drip-page-hero__copy">
            <p className="standalone-eyebrow">Nasty Rewards</p>
            <h1>Get Nasty. Earn Drip Points. Eat Free.</h1>
            <p>
              Create a Nasty account, start with {DRIP_SIGNUP_BONUS} points and
              earn {DRIP_POINTS_PER_AUD} points for every A$1 of eligible order value.
            </p>
            <div className="drip-page-hero__stat">
              <strong>{profile ? balance.toLocaleString() : DRIP_SIGNUP_BONUS}</strong>
              <span>{profile ? "current Drip Points balance" : "Drip Points to start"}</span>
            </div>
          </div>

          <div className="drip-page-hero__art" aria-hidden="true">
            <span className="drip-page-hero__glow" />
            <Image src="/images/drip-points/drip-coin.png" alt="" width={620} height={620} priority />
          </div>
        </section>

        <section className="drip-page-benefits" aria-labelledby="drip-benefits-title">
          <div className="drip-page-benefits__heading">
            <p className="standalone-eyebrow">How Drip Points work</p>
            <h2 id="drip-benefits-title">Simple earning. One clear reward target.</h2>
            <p>{DRIP_SIGNUP_BONUS} signup points equals 25% of the {DRIP_REWARD_TARGET.toLocaleString()}-point target for a free Beast Burger Meal.</p>
          </div>

          <div className="drip-page-benefit-grid">
            <article><span>01</span><strong>Join +{DRIP_SIGNUP_BONUS}</strong><p>Create your customer account and receive the one-time signup bonus.</p></article>
            <article><span>02</span><strong>{DRIP_POINTS_PER_AUD} points / A$1</strong><p>Points are calculated from the validated order subtotal after checkout.</p></article>
            <article><span>03</span><strong>{DRIP_REWARD_TARGET.toLocaleString()} point target</strong><p>Reach the reward target for the free Beast Burger Meal reward. Production redemption will be validated server-side.</p></article>
          </div>
        </section>

        {!ready ? (
          <div className="cart-page-loading">Loading Drip Points…</div>
        ) : !profile ? (
          <section className="drip-page-signup" aria-labelledby="drip-signup-title">
            <div className="drip-page-signup__copy">
              <p className="standalone-eyebrow">Join Drip Points</p>
              <h2 id="drip-signup-title">Start with {DRIP_SIGNUP_BONUS} Drip Points.</h2>
              <p>Drip Points are now tied to your Nasty customer account so orders, rewards and history stay together.</p>
            </div>
            <div className="drip-page-success">
              <Image src="/images/drip-points/drip-coin.png" alt="" width={90} height={90} />
              <strong>{DRIP_SIGNUP_BONUS} welcome points</strong>
              <span>Create your account to activate your rewards balance.</span>
              <Link className="standalone-primary-button" href="/account/create?return=/drip-points">Create account</Link>
              <Link className="standalone-secondary-link" href="/account/sign-in">Already have an account? Sign in</Link>
            </div>
          </section>
        ) : (
          <>
            <section className="drip-account-panel">
              <div className="drip-balance-card">
                <div className="drip-balance-card__top">
                  <div><p className="standalone-eyebrow">{profile.name}&apos;s balance</p><strong>{balance.toLocaleString()}</strong><span>Drip Points</span></div>
                  <Image src="/images/drip-points/drip-coin.png" alt="" width={90} height={90} />
                </div>
                <div className="drip-balance-progress" aria-label={`${progress}% toward reward`}><span><b style={{ width: `${progress}%` }} /></span><div><small>{progress}% complete</small><strong>{remaining === 0 ? "Reward target reached" : `${remaining.toLocaleString()} points to go`}</strong></div></div>
                <Link className="standalone-primary-button" href="/menu/burgers">Earn more points</Link>
              </div>

              <div className="drip-ledger-card">
                <div className="account-section-heading"><div><p className="standalone-eyebrow">Activity</p><h2>Points history</h2></div><Link href="/account">Account</Link></div>
                {ledger.length === 0 ? <p>No Drip Points activity yet.</p> : (
                  <div className="drip-ledger-list">
                    {ledger.map((entry) => (
                      <article key={entry.id}>
                        <div><strong>{entry.description}</strong><span>{formatDate(entry.createdAt)}{entry.orderId ? ` · ${entry.orderId}` : ""}</span></div>
                        <b className={entry.points >= 0 ? "is-positive" : "is-negative"}>{entry.points >= 0 ? "+" : ""}{entry.points.toLocaleString()}</b>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {balance >= DRIP_REWARD_TARGET && (
              <section className="drip-reward-unlocked">
                <p className="standalone-eyebrow">Reward unlocked</p>
                <h2>You&apos;ve reached the free Beast Burger Meal target.</h2>
                <p>We&apos;ll activate secure redemption once the production customer database and admin validation flow are connected, so points can&apos;t be duplicated or redeemed twice.</p>
              </section>
            )}
          </>
        )}
      </main>
      <MobileBottomNav active="drip" />
    </div>
  );
}
