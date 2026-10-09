import type { Metadata } from "next";
import { localize, productTitle, type SeoPageId, type SiteContent } from "../app/site-content-data";

export function pageMetadata(content: SiteContent, page: SeoPageId): Metadata {
  const entry = content.seo.pages[page];
  const title = localize(entry.title, "he", localize(content.seo.defaultTitle, "he"));
  const description = localize(entry.description, "he", localize(content.seo.defaultDescription, "he"));
  const image = entry.socialImage || content.seo.shareImage;
  return {
    title,
    description,
    openGraph: { title, description, locale: "he_IL", type: "website", ...(image ? { images: [image] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export function productMetadata(content: SiteContent, slug: string): Metadata {
  const product = content.products.find((item) => item.id === slug && item.visible);
  if (!product) return pageMetadata(content, "products");
  const productName = productTitle(product, "he");
  const title = localize(product.seoTitle, "he", `${productName} | ${localize(content.settings.companyName, "he")}`);
  const description = localize(product.seoDescription, "he", localize(product.description, "he", productName));
  const image = product.socialImage || product.image;
  return {
    title,
    description,
    openGraph: { title, description, locale: "he_IL", type: "website", ...(image ? { images: [image] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export function rootMetadata(content: SiteContent): Metadata {
  const title = localize(content.seo.defaultTitle, "he");
  const description = localize(content.seo.defaultDescription, "he");
  const image = content.seo.shareImage;
  return {
    title,
    description,
    openGraph: { title, description, locale: "he_IL", type: "website", ...(image ? { images: [image] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}
