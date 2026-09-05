import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MobileBottomNav from "../components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Beast of the Month — Coming Soon | Nasty Burger House",
  description: "The next Nasty Burger House Beast of the Month is coming soon.",
};

export default function BeastOfTheMonthPage() {
  return (
    <div className="standalone-page beast-month-page">
      <main className="standalone-main beast-month-main">
        <section className="beast-month-hero">
          <div className="beast-month-hero__media">
            <Image
              src="/images/home-menu/beast-of-the-month.jpg"
              alt="Nasty Burger House Beast of the Month coming soon"
              fill
              priority
              sizes="100vw"
            />
            <div className="beast-month-hero__shade" aria-hidden="true" />
          </div>

          <div className="beast-month-hero__copy">
            <p className="standalone-eyebrow">Coming soon</p>
            <h1>Beast of the Month</h1>
            <h2>A new Beast is loading.</h2>
            <p>
              The next limited-time Nasty Burger House drop is being cooked up.
              Watch this space — it&apos;s coming soon.
            </p>
            <div className="beast-month-hero__actions">
              <Link className="standalone-primary-button" href="/menu/burgers">
                Explore the current menu
              </Link>
            </div>
          </div>
        </section>

        <section className="beast-month-details" aria-labelledby="beast-details-title">
          <div>
            <p className="standalone-eyebrow">Next drop</p>
            <h2 id="beast-details-title">Something nasty is on the way.</h2>
          </div>
          <div className="beast-month-detail-grid">
            <article>
              <span>01</span>
              <strong>New Beast</strong>
              <p>A fresh limited-time creation is joining the menu.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Limited time</strong>
              <p>When it drops, it won&apos;t be around forever.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Coming soon</strong>
              <p>Keep an eye on Nasty Burger House for the reveal.</p>
            </article>
          </div>
        </section>

        <section className="beast-month-order-card">
          <div>
            <p className="standalone-eyebrow">Hungry now?</p>
            <h2>The current Beast Burger lineup is ready for pickup.</h2>
          </div>
          <Link className="standalone-primary-button" href="/menu/burgers">
            Browse Beast Burgers
          </Link>
        </section>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}
