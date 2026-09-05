import type { Metadata } from "next";
import DripPointsPage from "../components/drip-points-page";

export const metadata: Metadata = {
  title: "Drip Points | Nasty Burger House",
  description: "Join Nasty Burger House Drip Points and start with 500 points.",
};

export default function DripPointsRoute() {
  return <DripPointsPage />;
}
