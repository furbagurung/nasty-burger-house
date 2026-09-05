"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import MobileBottomNav from "./mobile-bottom-nav";

const LOYALTY_STORAGE_KEY = "nasty-burger-drip-signup";

export default function DripPointsPage() {
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    setJoined(window.localStorage.getItem(LOYALTY_STORAGE_KEY) === "complete");
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(LOYALTY_STORAGE_KEY, "complete");
    setJoined(true);
  };

  return (
    <div className="standalone-page drip-page">
      <main className="standalone-main drip-page-main">
        <section className="drip-page-hero">
          <div className="drip-page-hero__copy">
            <p className="standalone-eyebrow">Nasty Rewards</p>
            <h1>Get Nasty. Earn Drip Points. Eat Free.</h1>
            <p>
              Join Drip Points and start with 500 points. Keep ordering, keep earning,
              and unlock rewards made for hungry regulars.
            </p>
            <div className="drip-page-hero__stat">
              <strong>500</strong>
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

        <section className="drip-page-benefits" aria-labelledby="drip-benefits-title">
          <div className="drip-page-benefits__heading">
            <p className="standalone-eyebrow">How it starts</p>
            <h2 id="drip-benefits-title">Your first 500 points are already a head start.</h2>
            <p>
              Signing up puts you 25% of the way to a free Beast Burger Meal.
            </p>
          </div>

          <div className="drip-page-benefit-grid">
            <article>
              <span>01</span>
              <strong>Join</strong>
              <p>Sign up with your email and phone number.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Start with 500</strong>
              <p>Your Drip Points journey starts immediately with 500 points.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Keep earning</strong>
              <p>Purchase earning and redemption will connect with the loyalty platform.</p>
            </article>
          </div>
        </section>

        <section className="drip-page-signup" aria-labelledby="drip-signup-title">
          <div className="drip-page-signup__copy">
            <p className="standalone-eyebrow">Join Drip Points</p>
            <h2 id="drip-signup-title">
              {joined ? "You&apos;re in." : "Start with 500 Drip Points."}
            </h2>
            <p>
              {joined
                ? "Your Drip Points signup is saved on this device."
                : "Enter your email and phone number to join the loyalty program."}
            </p>
          </div>

          {joined ? (
            <div className="drip-page-success">
              <Image
                src="/images/drip-points/drip-coin.png"
                alt=""
                width={90}
                height={90}
              />
              <strong>500 Drip Points</strong>
              <span>Welcome to Nasty Rewards.</span>
              <Link className="standalone-primary-button" href="/menu/burgers">
                Start ordering
              </Link>
            </div>
          ) : (
            <form className="drip-page-form" onSubmit={submit}>
              <label>
                Email address
                <input type="email" name="email" autoComplete="email" required />
              </label>
              <label>
                Phone number
                <input type="tel" name="phone" autoComplete="tel" required />
              </label>
              <button className="standalone-primary-button" type="submit">
                Get 500 Drip Points
              </button>
            </form>
          )}
        </section>
      </main>

      <MobileBottomNav active="drip" />
    </div>
  );
}
