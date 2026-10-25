import { renderNastyBrandIcon } from "./lib/brand-icon";

export const alt = "Nasty Burger House";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return renderNastyBrandIcon(size.width);
}
