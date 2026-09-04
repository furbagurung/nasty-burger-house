import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "../data/menu";
import {
  menuNavigationCategories,
  type MenuPageCategory,
} from "../data/menu-pages";
import CatalogueMobileMenu from "./catalogue-mobile-menu";
import MenuItemMedia from "./menu-item-media";
import MobileBottomNav from "./mobile-bottom-nav";

type MenuCategoryPageProps = {
  category: MenuPageCategory;
  items: MenuItem[];
};

export default function MenuCategoryPage({
  category,
  items,
}: MenuCategoryPageProps) {
  return (
    <div className="catalogue-shell">
      <header className="catalogue-header">
        <CatalogueMobileMenu />
        <Link className="catalogue-logo" href="/" aria-label="Nasty Burger House home">
          <Image src="/logo.webp" alt="" width={456} height={456} priority />
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
            {menuNavigationCategories.map((menuCategory) => (
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

          <div className="catalogue-product-grid catalogue-product-grid--browse">
            {items.map((item) => (
              <Link
                className="catalogue-product catalogue-product--browse"
                href={`/product/${item.id}`}
                key={item.id}
                aria-label={`View ${item.name}`}
              >
                <div className="catalogue-product__media catalogue-product__media--browse">
                  <MenuItemMedia
                    item={item}
                    sizes="(max-width: 680px) 44vw, (max-width: 1100px) 28vw, 22vw"
                  />
                </div>
                <h2>{item.name}</h2>
              </Link>
            ))}
          </div>
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
          <Link href="/help-support">Help &amp; Support</Link>
        </nav>
      </footer>

      <MobileBottomNav active="menu" />
    </div>
  );
}
