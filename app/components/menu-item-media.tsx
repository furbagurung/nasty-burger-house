import Image from "next/image";
import type { MenuItem } from "../data/menu";

type MenuItemMediaProps = {
  item: MenuItem;
  priority?: boolean;
  sizes: string;
};

function demoImageFor(item: MenuItem) {
  if (item.image) return item.image;
  if (item.category === "burgers") return "/images/signature-beast.webp";
  if (item.category === "beast-boxes") return "/images/beast-box-hero.webp";
  return null;
}

export default function MenuItemMedia({
  item,
  priority = false,
  sizes,
}: MenuItemMediaProps) {
  const image = demoImageFor(item);

  if (image) {
    return (
      <Image
        src={image}
        alt={`${item.name} placeholder food photography`}
        fill
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div className="catalogue-product__placeholder" role="img" aria-label={`${item.name} image coming soon`}>
      <span>NBH</span>
      <small>
        {item.category === "drinks" ? "Drink image" : "Food image"} coming soon
      </small>
    </div>
  );
}
