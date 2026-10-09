import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuCategoryPage from "../../components/menu-category-page";
import { menuItems } from "../../data/menu";
import { readMenuAvailability } from "../../lib/menu-availability";
import {
  findMenuPageCategory,
  menuPageCategories,
} from "../../data/menu-pages";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return menuPageCategories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categoryId } = await params;
  const category = findMenuPageCategory(categoryId);

  if (!category) return {};

  return {
    title: `${category.label} Menu | Nasty Burger House`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categoryId } = await params;
  const category = findMenuPageCategory(categoryId);

  if (!category) notFound();

  const availability = await readMenuAvailability();
  const soldOutSet = new Set(availability.soldOutIds);
  const liveItems = menuItems.map((item) => ({ ...item, soldOut: soldOutSet.has(item.id) }));
  const vegItemIds = new Set(["green-beast", "nasty-fries", "dirty-eggplant"]);

  const items =
    category.id === "featured"
      ? liveItems.filter((item) => item.featured)
      : category.id === "burgers"
        ? liveItems.filter((item) => item.category === "burgers")
        : category.id === "veg"
          ? liveItems.filter((item) => vegItemIds.has(item.id))
          : liveItems.filter((item) => item.category === category.id);

  return <MenuCategoryPage category={category} items={items} />;
}
