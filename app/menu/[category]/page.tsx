import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuCategoryPage from "../../components/menu-category-page";
import { menuItems } from "../../data/menu";
import {
  findMenuPageCategory,
  menuPageCategories,
} from "../../data/menu-pages";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

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

  const items =
    category.id === "featured"
      ? menuItems.filter((item) => item.featured)
      : menuItems.filter((item) => item.category === category.id);

  return <MenuCategoryPage category={category} items={items} />;
}
