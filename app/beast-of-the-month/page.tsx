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
