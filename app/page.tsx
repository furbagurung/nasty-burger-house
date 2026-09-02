import OrderExperience from "./components/order-experience";
import { menuItems } from "./data/menu";

export default function Home() {
  return <OrderExperience items={menuItems} />;
}
