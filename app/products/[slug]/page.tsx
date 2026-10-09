import Site from "../../site";
import { notFound } from "next/navigation";
import { readSiteContent } from "@/lib/site-content-store";
import { productMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, content] = await Promise.all([params, readSiteContent()]);
  return productMetadata(content, slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, content] = await Promise.all([params, readSiteContent()]);
  if (!content.products.some((product) => product.id === slug && product.visible)) notFound();
  return <Site page="product" slug={slug} />;
}
