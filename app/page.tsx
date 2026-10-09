import FindUsSection from "./components/find-us-section";
import HomeBeastMonthEnhancer from "./components/home-beast-month-enhancer";
import HomeHeroPhotographyEnhancer from "./components/home-hero-photography-enhancer";
import HomeMenuCategoriesEnhancer from "./components/home-menu-categories-enhancer";
import HomeMenuComingSoonGuard from "./components/home-menu-coming-soon-guard";
import HomeSquareCheckoutEnhancer from "./components/home-square-checkout-enhancer";
import OrderExperience from "./components/order-experience";
import { menuItems } from "./data/menu";
import { getServiceStatus } from "./lib/service";
import { readMenuAvailability } from "./lib/menu-availability";

// Availability must reflect fresh admin Sold Out changes, not a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function Home() {
  const availability = await readMenuAvailability();
  const soldOut = new Set(availability.soldOutIds);
  const items = menuItems.map((item) => ({ ...item, soldOut: soldOut.has(item.id) }));
  return (
    <>
      <OrderExperience
        items={items}
        initialServiceStatus={getServiceStatus()}
      />
      <FindUsSection />
      <HomeBeastMonthEnhancer />
      <HomeHeroPhotographyEnhancer />
      <HomeMenuCategoriesEnhancer />
      <HomeMenuComingSoonGuard />
      <HomeSquareCheckoutEnhancer />
    </>
  );
}
