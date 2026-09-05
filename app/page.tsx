import FindUsSection from "./components/find-us-section";
import HomeBeastMonthEnhancer from "./components/home-beast-month-enhancer";
import HomeMenuCategoriesEnhancer from "./components/home-menu-categories-enhancer";
import HomeMenuComingSoonGuard from "./components/home-menu-coming-soon-guard";
import OrderExperience from "./components/order-experience";
import { menuItems } from "./data/menu";
import { getServiceStatus } from "./lib/service";

export default function Home() {
  return (
    <>
      <OrderExperience
        items={menuItems}
        initialServiceStatus={getServiceStatus()}
      />
      <FindUsSection />
      <HomeBeastMonthEnhancer />
      <HomeMenuCategoriesEnhancer />
      <HomeMenuComingSoonGuard />
    </>
  );
}
