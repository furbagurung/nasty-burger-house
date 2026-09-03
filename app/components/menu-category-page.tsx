import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "../data/menu";
import {
  menuPageCategories,
  type MenuPageCategory,
} from "../data/menu-pages";
import type { ServiceStatus } from "../lib/service";

type MenuCategoryPageProps = {
  category: MenuPageCategory;
  items: MenuItem[];
  serviceStatus: ServiceStatus;
};

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function MenuCategoryPage({
  category,
  items,
  serviceStatus,
}: MenuCategoryPageProps) {
  return (
    <div className="catalogue-shell">
      <div className="service-bar catalogue-service-bar">
        <div className="service-bar__status">
          <span
            className={`status-dot status-dot--${serviceStatus.statusTone}`}
            aria-hidden="true"
          />
          <strong>{serviceStatus.statusLabel}</strong>
        </div>
        <p>
          {serviceStatus.locationName} · {serviceStatus.tradingHours}
        </p>
        <p>Estimated prep: {serviceStatus.prepTimeLabel}</p>
      </div>

      <header className="catalogue-header">
        <Link className="catalogue-logo" href="/" aria-label="Nasty Burger House home">
          <Image src="/logo.webp" alt="" width={256} height={256} priority />
        </Link>

        <nav className="catalogue-desktop-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link className="is-active" href="/menu/burgers">
            Menu
          </Link>
          <Link href="/#beast-month">What&apos;s New</Link>
          <Link href="/?loyalty=1">Drip Points</Link>
        </nav>

        <div className="catalogue-header-actions">
          <Link className="catalogue-location-link" href="/#location">
            Find the truck
          </Link>
          <Link className="catalogue-order-button" href="/menu/burgers">
            Order Now
          </Link>
          <details className="catalogue-mobile-nav">
            <summary aria-label="Open navigation">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/menu/burgers">Menu</Link>
              <Link href="/#beast-month">What&apos;s New</Link>
              <Link href="/?loyalty=1">Drip Points</Link>
              <Link href="/#location">Find the truck</Link>
            </nav>
          </details>
        </div>
      </header>

      <main className="catalogue-main">
        <aside className="catalogue-categories" aria-label="Menu categories">
          <p>Our menu</p>
          <nav>
            {menuPageCategories.map((menuCategory) => (
              <Link
                className={menuCategory.id === category.id ? "is-active" : ""}
                href={`/menu/${menuCategory.id}`}
                key={menuCategory.id}
                aria-current={menuCategory.id === category.id ? "page" : undefined}
              >
                <span className="catalogue-category-mark" aria-hidden="true">
                  {menuCategory.shortLabel}
                </span>
                <span>{menuCategory.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <section className="catalogue-content" aria-labelledby="catalogue-title">
          <div className="catalogue-heading">
            <p className="eyebrow">Nasty Burger House menu</p>
            <h1 id="catalogue-title">{category.label}</h1>
            <p>{category.description}</p>
          </div>

          <div className="catalogue-product-grid">
            {items.map((item) => (
              <Link
                className="catalogue-product"
                href={`/?item=${item.id}`}
                key={item.id}
                aria-label={`Customise and order ${item.name}`}
              >
                <div className="catalogue-product__media">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 720px) 80vw, 24vw"
                    />
                  ) : (
                    <div className="catalogue-product__placeholder" aria-hidden="true">
                      <span>{item.name.slice(0, 1)}</span>
                      <small>Photo coming soon</small>
                    </div>
                  )}
                </div>
                <h2>{item.name}</h2>
                <p>
                  {money.format(item.price)}
                  {item.priceConfirmed === false && <small> · Provisional</small>}
                </p>
                <span className="catalogue-product__action">
                  Customise &amp; order
                </span>
              </Link>
            ))}
          </div>

          <p className="catalogue-disclaimer">
            Supplied menu prices are updated. Monster Cheese, standalone drinks,
            modifiers and kids&apos; drinks remain provisional until confirmed.
          </p>
        </section>
      </main>

      <footer className="catalogue-footer">
        <div>
          <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} />
          <p>Food-truck pickup ordering built around today&apos;s location.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/menu/burgers">Menu</Link>
          <Link href="/#location">Find Us</Link>
          <Link href="/?loyalty=1">Drip Points</Link>
        </nav>
      </footer>

      <nav className="catalogue-app-nav" aria-label="Mobile app navigation">
        <Link href="/">
          <strong aria-hidden="true">⌂</strong>
          <span>Home</span>
        </Link>
        <Link className="is-active" href={`/menu/${category.id}`} aria-current="page">
          <strong aria-hidden="true">≡</strong>
          <span>Menu</span>
        </Link>
        <Link href="/#beast-month">
          <strong aria-hidden="true">★</strong>
          <span>New</span>
        </Link>
        <Link href="/?loyalty=1">
          <strong aria-hidden="true">D</strong>
          <span>Points</span>
        </Link>
      </nav>
    </div>
  );
}
