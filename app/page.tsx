import { getServiceStatus } from "./lib/service";
import { unavailableShopStatus } from "./lib/shop-control";
import FindUsSection from "./components/find-us-section";
import HomeBeastMonthEnhancer from "./components/home-beast-month-enhancer";
import HomeHeroPhotographyEnhancer from "./components/home-hero-photography-enhancer";
import HomeMenuCategoriesEnhancer from "./components/home-menu-categories-enhancer";
import HomeMenuComingSoonGuard from "./components/home-menu-coming-soon-guard";
import OrderExperience from "./components/order-experience";
import { menuItems } from "./data/menu";

// Render the static catalogue immediately. Client components refresh live
// stock and shop control separately; checkout still verifies server-side.
export default function Home() {
  return (
    <>
      <OrderExperience
        items={menuItems}
        initialServiceStatus={unavailableShopStatus(getServiceStatus())}
      />
      <FindUsSection />
      <HomeBeastMonthEnhancer />
      <HomeHeroPhotographyEnhancer />
      <HomeMenuCategoriesEnhancer />
      <HomeMenuComingSoonGuard />
    </>
  );
}
