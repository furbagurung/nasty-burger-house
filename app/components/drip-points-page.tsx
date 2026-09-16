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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [customer, activity] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerDripActivity(),
        ]);

        if (!active) return;
        setProfile(customer);
        setLedger(activity.entries);
        setBalance(activity.balance);
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
      ledger.reduce(
        (total, entry) =>
          entry.points > 0 && entry.status !== "void"
            ? total + entry.points
            : total,
        0,
      ),
    [ledger],
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
                  Create a Nasty account, start with {DRIP_SIGNUP_BONUS} points
                  and earn {DRIP_POINTS_PER_AUD} points for every A$1 of eligible
                  order value.
                </p>
                <div className="drip-page-hero__stat">
                  <strong>{DRIP_SIGNUP_BONUS}</strong>
                  <span>Drip Points to start</span>
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
                <p>
                  {DRIP_SIGNUP_BONUS} signup points equals 25% of the{" "}
                  {DRIP_REWARD_TARGET.toLocaleString()}-point target for a free
                  Beast Burger Meal.
                </p>
              </div>

              <div className="drip-page-benefit-grid">
                <article>
                  <span>01</span>
                  <strong>Join +{DRIP_SIGNUP_BONUS}</strong>
                  <p>Create a verified account and receive the one-time signup bonus.</p>
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
                  Start with {DRIP_SIGNUP_BONUS} Drip Points.
                </h2>
                <p>
                  Drip Points are tied to your authenticated Nasty account so
                  rewards cannot be duplicated between devices.
                </p>
              </div>
              <div className="drip-page-success">
                <Image
                  src="/images/drip-points/drip-coin.png"
                  alt=""
                  width={90}
                  height={90}
                />
                <strong>{DRIP_SIGNUP_BONUS} welcome points</strong>
                <span>Create your account to activate your rewards balance.</span>
                <Link
                  className="standalone-primary-button"
                  href="/account/create?return=/drip-points"
                >
                  Create account
                </Link>
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
              <div className="account-inline-notice">
                <span>{error}</span>
              </div>
            )}

            <section className="drip-dashboard-balance" aria-label="Drip Points balance">
              <div className="drip-dashboard-balance__decor" aria-hidden="true" />
              <div className="drip-dashboard-balance__top">
                <div className="drip-dashboard-balance__identity">
                  <p>{profile.name}</p>
                  <strong>{balance.toLocaleString()}</strong>
                  <span>Your available Drip Points</span>
                </div>

                <div className="drip-dashboard-balance__member">
                  <Image
                    src="/images/drip-points/drip-coin.png"
                    alt=""
                    width={36}
                    height={36}
                  />
                  <span>Drip Member</span>
                </div>
              </div>

              <div
                className="drip-dashboard-balance__progress"
                aria-label={`${progress}% toward the next reward`}
              >
                <span>
                  <b style={{ width: `${progress}%` }} />
                </span>
                <div>
                  <small>
                    {progress}% to reward
                    {pendingPoints > 0
                      ? ` · ${pendingPoints.toLocaleString()} pending`
                      : ""}
                  </small>
                  <strong>
                    {remaining === 0
                      ? "Reward target reached"
                      : `${remaining.toLocaleString()} points to go`}
                  </strong>
                </div>
              </div>
            </section>

            <section className="drip-dashboard-stats" aria-label="Drip Points totals">
              <article>
                <strong>{earnedPoints.toLocaleString()}</strong>
                <span>Earned points</span>
              </article>
              <span className="drip-dashboard-stats__divider" aria-hidden="true" />
              <article>
                <strong>{redeemedPoints.toLocaleString()}</strong>
                <span>Redeemed points</span>
              </article>
            </section>

            <section className="drip-dashboard-earn">
              <div className="drip-dashboard-earn__copy">
                <p className="standalone-eyebrow">Nasty Rewards</p>
                <h2>Earn more Drip Points</h2>
                <p>
                  Order your favourites, collect points and move closer to your
                  next free Beast Burger Meal.
                </p>
                <Link href="/menu/burgers">
                  Explore menu <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="drip-dashboard-earn__art" aria-hidden="true">
                <Image
                  src="/images/drip-points/drip-coin.png"
                  alt=""
                  width={150}
                  height={150}
                />
              </div>
            </section>

            <section className="drip-dashboard-membership">
              <div className="drip-dashboard-section-heading">
                <p className="standalone-eyebrow">Membership info</p>
                <h2>Your Drip membership</h2>
              </div>

              <div className="drip-dashboard-membership__card">
                <div className="drip-dashboard-membership__intro">
                  <div className="drip-dashboard-membership__coin" aria-hidden="true">
                    <Image
                      src="/images/drip-points/drip-coin.png"
                      alt=""
                      width={58}
                      height={58}
                    />
                  </div>
                  <div>
                    <strong>Drip Member</strong>
                    <span>{balance.toLocaleString()} available points</span>
                  </div>
                </div>

                <div className="drip-dashboard-membership__benefits">
                  <h3>Membership benefits</h3>
                  <ul>
                    <li>
                      Earn {DRIP_POINTS_PER_AUD} points for every A$1 of eligible
                      order value.
                    </li>
                    <li>
                      New verified members receive {DRIP_SIGNUP_BONUS} welcome points.
                    </li>
                    <li>
                      Points become available after the pickup order is completed.
                    </li>
                    <li>
                      {remaining === 0
                        ? "You have reached the current reward target."
                        : `${remaining.toLocaleString()} more available points unlocks the current reward target.`}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="drip-dashboard-history">
              <div className="drip-dashboard-section-heading drip-dashboard-section-heading--row">
                <div>
                  <p className="standalone-eyebrow">Activity</p>
                  <h2>Points history</h2>
                </div>
                <Link href="/account">Account</Link>
              </div>

              {ledger.length === 0 ? (
                <p className="drip-dashboard-history__empty">
                  No Drip Points activity yet.
                </p>
              ) : (
                <div className="drip-dashboard-history__list">
                  {ledger.map((entry) => (
                    <article key={entry.id}>
                      <div>
                        <strong>{entry.description}</strong>
                        <span>
                          {formatDate(entry.createdAt)}
                          {entry.orderId ? ` · ${entry.orderId}` : ""}
                          {entry.status && entry.status !== "available"
                            ? ` · ${entry.status}`
                            : ""}
                        </span>
                      </div>
                      <b className={entry.points >= 0 ? "is-positive" : "is-negative"}>
                        {entry.points >= 0 ? "+" : ""}
                        {entry.points.toLocaleString()}
                      </b>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <MobileBottomNav active="drip" />
    </div>
  );
}
