export const dynamic = "force-dynamic";
import CheckoutPage from "../components/checkout-page";
import { readShopStatus } from "../lib/shop-status";

export default async function Page() {
  return <CheckoutPage serviceStatus={await readShopStatus()} />;
}
