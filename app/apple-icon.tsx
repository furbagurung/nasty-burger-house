import { renderNastyBrandIcon } from "./lib/brand-icon";

export const alt = "Nasty Burger House";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderNastyBrandIcon(size.width);
}
