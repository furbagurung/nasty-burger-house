import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailPage from "../../components/product-detail-page";
import { menuItems } from "../../data/menu";

type ProductPageProps = {
  params: Promise<{ item: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return menuItems.map((item) => ({ item: item.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { item: itemId } = await params;
  const item = menuItems.find((entry) => entry.id === itemId);

  if (!item) return {};

  return {
    title: `${item.name} | Nasty Burger House`,
    description: item.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { item: itemId } = await params;
  const item = menuItems.find((entry) => entry.id === itemId);

  if (!item) notFound();

  return <ProductDetailPage item={item} />;
}
