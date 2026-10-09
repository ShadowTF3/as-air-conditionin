import type { Metadata } from "next";
import { localize, productTitle, type SeoPageId, type SiteContent } from "../app/site-content-data";

const metadataBase = new URL(process.env.PUBLIC_SITE_URL || "https://as-air-conditionin.onrender.com");
const shareImage = "/share-logo.jpg";
const brandTitle = "א.ס מיזוג אוויר | מזגנים, התקנה ושירות";
const brandDescription = "פתרונות מיזוג לבית ולעסק: בחירת מזגן, התקנה, תחזוקה ותיקונים בכל הארץ.";

export const siteBrandMetadata: Metadata = {
  metadataBase,
  title: brandTitle,
  description: brandDescription,
  openGraph: {
    title: brandTitle,
    description: brandDescription,
    locale: "he_IL",
    type: "website",
    images: [{ url: shareImage, width: 1200, height: 630, alt: "א.ס מיזוג אוויר" }],
  },
  twitter: { card: "summary_large_image", title: brandTitle, description: brandDescription, images: [shareImage] },
  icons: {
    icon: [{ url: "/favicon-company.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/favicon-company.png",
    apple: "/apple-touch-icon.png",
  },
};

export function pageMetadata(content: SiteContent, page: SeoPageId): Metadata {
  const entry = content.seo.pages[page];
  const title = localize(entry.title, "he", localize(content.seo.defaultTitle, "he"));
  const description = localize(entry.description, "he", localize(content.seo.defaultDescription, "he"));
  const companyName = localize(content.settings.companyName, "he");
  const image = shareImage;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: "he_IL",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: companyName }],
    },
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
  const companyName = localize(content.settings.companyName, "he");
  const image = shareImage;
  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      locale: "he_IL",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: companyName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    icons: siteBrandMetadata.icons,
  };
}
