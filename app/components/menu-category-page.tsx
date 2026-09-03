import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "../data/menu";
import {
  menuPageCategories,
  type MenuPageCategory,
} from "../data/menu-pages";
import CatalogueMobileMenu from "./catalogue-mobile-menu";
import MenuItemMedia from "./menu-item-media";
import MobileBottomNav from "./mobile-bottom-nav";

type MenuCategoryPageProps = {
  category: MenuPageCategory;
  items: MenuItem[];
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
}: MenuCategoryPageProps) {
  return (
    <div className="catalogue-shell">
      <header className="catalogue-header">
        <CatalogueMobileMenu />
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
          <Link className="catalogue-order-button" href="/menu/burgers">
            Order Now
          </Link>
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
                href={`/product/${item.id}`}
                key={item.id}
                aria-label={`View ${item.name}`}
              >
                <div className="catalogue-product__media">
                  <MenuItemMedia item={item} sizes="(max-width: 680px) 42vw, 24vw" />
                </div>
                <h2>{item.name}</h2>
                <p>
                  {money.format(item.price)}
                  {item.priceConfirmed === false && <small> · Provisional</small>}
                </p>
                <span className="catalogue-product__action">
                  View item <strong aria-hidden="true">+</strong>
                </span>
              </Link>
            ))}
          </div>

          <p className="catalogue-disclaimer">
            Printed menu prices are confirmed. Standalone drink and modifier
            prices remain provisional until supplied.
          </p>
        </section>
      </main>

      <footer className="catalogue-footer">
        <div>
          <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} />
          <p>Order online and collect from Nasty Burger House.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/menu/burgers">Menu</Link>
          <Link href="/?loyalty=1">Drip Points</Link>
        </nav>
      </footer>

      <MobileBottomNav active="menu" />
    </div>
  );
}
