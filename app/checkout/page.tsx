import CheckoutPage from "../components/checkout-page";
import { getServiceStatus } from "../lib/service";

export default function Page() {
  return <CheckoutPage serviceStatus={getServiceStatus()} />;
}
