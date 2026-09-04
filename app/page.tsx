import HomeMenuCategoriesEnhancer from "./components/home-menu-categories-enhancer";
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
      <HomeMenuCategoriesEnhancer />
    </>
  );
}
