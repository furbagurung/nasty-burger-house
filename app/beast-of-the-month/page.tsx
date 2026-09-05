import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MobileBottomNav from "../components/mobile-bottom-nav";
import { menuItems } from "../data/menu";

export const metadata: Metadata = {
  title: "Beast of the Month | Nasty Burger House",
  description: "Meet the current Nasty Burger House Beast of the Month.",
};

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function BeastOfTheMonthPage() {
  const beast = menuItems.find((item) => item.id === "bbq-beast");

  if (!beast) return null;

  return (
    <div className="standalone-page beast-month-page">
      <main className="standalone-main beast-month-main">
        <section className="beast-month-hero">
          <div className="beast-month-hero__media">
            <Image
              src="/images/bbq-beast-hero.webp"
              alt="BBQ Beast burger with beef, bacon, cheese and smoky Bourbon BBQ sauce"
              fill
              priority
              sizes="100vw"
            />
            <div className="beast-month-hero__shade" aria-hidden="true" />
          </div>

          <div className="beast-month-hero__copy">
            <p className="standalone-eyebrow">Limited-time drop</p>
            <h1>Beast of the Month</h1>
            <h2>{beast.name}</h2>
            <p>{beast.description}</p>
            <div className="beast-month-hero__actions">
              <Link className="standalone-primary-button" href={`/product/${beast.id}`}>
                Order the {beast.name}
              </Link>
              <span>{money.format(beast.price)}</span>
            </div>
          </div>
        </section>

        <section className="beast-month-details" aria-labelledby="beast-details-title">
          <div>
            <p className="standalone-eyebrow">This month&apos;s beast</p>
            <h2 id="beast-details-title">Smoky. Cheesy. Properly nasty.</h2>
          </div>
          <div className="beast-month-detail-grid">
            <article>
              <span>01</span>
              <strong>Flame-grilled beef</strong>
              <p>The juicy beef base that keeps the BBQ Beast heavy and satisfying.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Crispy bacon + cheese</strong>
              <p>American cheese and crispy bacon bring the rich, salty bite.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Bourbon BBQ finish</strong>
              <p>House-made Bourbon BBQ sauce and creamy mayo finish the stack.</p>
            </article>
          </div>
        </section>

        <section className="beast-month-order-card">
          <div>
            <p className="standalone-eyebrow">Ready for it?</p>
            <h2>Make this month&apos;s Beast your next pickup.</h2>
          </div>
          <Link className="standalone-primary-button" href={`/product/${beast.id}`}>
            View {beast.name}
          </Link>
        </section>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}
