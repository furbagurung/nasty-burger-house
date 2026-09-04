import Image from "next/image";
import type { MenuItem } from "../data/menu";

type MenuItemMediaProps = {
  item: MenuItem;
  priority?: boolean;
  sizes: string;
};

const driveMenuImages: Record<string, string> = {
  hooked:
    "https://drive.google.com/uc?export=view&id=1FLop-ytWK0YYJL52YdBhnfJopmDtVp5G",
  "nasty-fries":
    "https://drive.google.com/uc?export=view&id=1Dq9EW_HnlsTVs6GGx6k8QkVY5veBfQLp",
  "coca-cola":
    "https://drive.google.com/uc?export=view&id=1CoZStX2n8UDQHdmKJvfoDvlGK9Tp68CM",
  "coke-no-sugar":
    "https://drive.google.com/uc?export=view&id=1CJHCn-fE7l-bXE-0KPksjoPS15hbolVn",
  fanta:
    "https://drive.google.com/uc?export=view&id=15Tsd_7K10e1L1VZ2V8U39XWOpw97ske-",
};

function demoImageFor(item: MenuItem) {
  if (driveMenuImages[item.id]) return driveMenuImages[item.id];
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
  const usesTemporaryImage = Boolean(image && !item.image && !driveMenuImages[item.id]);

  if (image) {
    const alt = usesTemporaryImage
      ? `${item.name} temporary food photography`
      : item.name;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return (
        <img
          src={image}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      );
    }

    return (
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div
      className="catalogue-product__placeholder"
      role="img"
      aria-label={`${item.name} image coming soon`}
    >
      <span>NBH</span>
      <small>
        {item.category === "drinks" ? "Drink image" : "Food image"} coming soon
      </small>
    </div>
  );
}
