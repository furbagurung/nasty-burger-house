import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "../data/menu";
import { comboUpgradePrice } from "../data/menu";
import { findMenuPageCategory } from "../data/menu-pages";
import CatalogueMobileMenu from "./catalogue-mobile-menu";
import MenuItemMedia from "./menu-item-media";
import MobileBottomNav from "./mobile-bottom-nav";

type ProductDetailPageProps = {
  item: MenuItem;
};

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function ProductDetailPage({ item }: ProductDetailPageProps) {
  const category = findMenuPageCategory(item.category);

  return (
    <div className="catalogue-shell product-page-shell">
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
          <Link className="catalogue-order-button" href={`/?item=${item.id}`}>
            Order Now
          </Link>
        </div>
      </header>

      <main className="product-detail">
        <div className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link href={`/menu/${item.category}`}>{category?.label ?? "Menu"}</Link>
          <span aria-hidden="true">/</span>
          <span>{item.name}</span>
        </div>

        <div className="product-detail__layout">
          <div className="product-detail__media">
            <MenuItemMedia
              item={item}
              sizes="(max-width: 680px) 94vw, 48vw"
              priority
            />
          </div>

          <section className="product-detail__content" aria-labelledby="product-title">
            <p className="eyebrow">{category?.label ?? "Nasty Burger House menu"}</p>
            <h1 id="product-title">{item.name}</h1>
            <p className="product-detail__price">
              {money.format(item.price)}
              {item.priceConfirmed === false && <small>Provisional price</small>}
            </p>
            <p className="product-detail__description">{item.description}</p>

            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <div className="product-detail__tags" aria-label="Dietary information">
                {item.dietaryTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            <div className="product-detail__options">
              {item.canUpgrade && (
                <div>
                  <strong>Make it a meal</strong>
                  <span>
                    Add Nasty Fries and a soft drink or water for {money.format(comboUpgradePrice)}.
                  </span>
                </div>
              )}
              {item.boxConfig && (
                <div>
                  <strong>Build your Beast Box</strong>
                  <span>
                    Choose {item.boxConfig.burgerCount} burger{item.boxConfig.burgerCount === 1 ? "" : "s"} and {item.boxConfig.drinkCount} drink{item.boxConfig.drinkCount === 1 ? "" : "s"} during customisation.
                  </span>
                </div>
              )}
              {item.removableIngredients && item.removableIngredients.length > 0 && (
                <div>
                  <strong>Make it yours</strong>
                  <span>Remove ingredients and add available extras before adding it to your cart.</span>
                </div>
              )}
            </div>

            <Link className="primary-button product-detail__order" href={`/?item=${item.id}`}>
              Customise &amp; order
            </Link>
            <p className="product-detail__notice">
              Pay when you collect. Online payment will be added after Square is connected.
            </p>
          </section>
        </div>
      </main>

      <footer className="catalogue-footer product-detail__footer">
        <div>
          <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} />
          <p>Order online and collect from Nasty Burger House.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href={`/menu/${item.category}`}>Back to {category?.label ?? "menu"}</Link>
          <Link href="/?loyalty=1">Drip Points</Link>
        </nav>
      </footer>

      <MobileBottomNav active="menu" />
    </div>
  );
}
