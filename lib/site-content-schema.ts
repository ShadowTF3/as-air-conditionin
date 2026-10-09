import { z } from "zod";

const text = z.string().trim().max(8_000);
const requiredText = text.min(1);
const localized = z.object({ he: text, ar: text, en: text });
const requiredLocalized = z.object({ he: requiredText, ar: requiredText, en: requiredText });
const imagePath = z.string().max(300).refine(
  (value) => /^\/images\/[\w./-]+$/.test(value) && !value.includes("..") || /^\/api\/media\?file=[a-f0-9-]{36}\.(?:jpg|png|webp|avif)$/.test(value),
  "Choose a safe site image or an uploaded media file.",
);
const optionalImage = imagePath.or(z.literal(""));
const href = z.string().trim().min(1).max(500).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a site path or a secure HTTPS link.");
const slug = z.string().trim().min(2).max(70).regex(/^[a-z0-9-]+$/);
const order = z.number().int().min(0).max(10_000);
const localizedTriple = z.tuple([requiredText, requiredText, requiredText]);
const specTriple = z.tuple([requiredText, requiredText, requiredText, requiredText]);

const copySchema = z.object({
  id: z.string().min(2).max(1200),
  group: z.enum(["global", "home", "products", "services", "about", "contact", "faq", "policies"]),
  source: text,
  he: requiredText,
  ar: requiredText,
  en: requiredText,
});

const managedProductSchema = z.object({
  id: slug,
  brandId: slug,
  categoryId: slug,
  brand: requiredText.max(60),
  name: requiredText.max(100),
  nameLocalized: requiredLocalized,
  description: requiredLocalized,
  warranty: requiredLocalized,
  price: z.number().finite().min(0).max(1_000_000),
  previousPrice: z.number().finite().min(0).max(1_000_000).optional(),
  cooling: z.number().finite().min(0).max(1_000_000),
  heating: z.number().finite().min(0).max(1_000_000).optional(),
  energy: requiredText.max(30),
  room: z.enum(["bedroom", "living", "large"]),
  image: imagePath,
  gallery: z.array(imagePath).max(20),
  source: text.max(500),
  specs: z.array(specTriple).max(80),
  features: z.array(localizedTriple).max(80),
  available: z.boolean(),
  visible: z.boolean(),
  featured: z.boolean(),
  order,
  seoTitle: localized,
  seoDescription: localized,
  socialImage: imagePath,
});

const categorySchema = z.object({
  id: slug,
  name: requiredLocalized,
  description: localized,
  image: optionalImage,
  order,
  visible: z.boolean(),
});
const brandSchema = z.object({
  id: slug,
  name: requiredLocalized,
  logo: optionalImage,
  order,
  visible: z.boolean(),
});
const offerSchema = z.object({
  id: slug,
  title: requiredLocalized,
  description: localized,
  image: imagePath,
  buttonLabel: requiredLocalized,
  href,
  productId: z.string().max(70),
  oldPrice: z.number().finite().min(0).max(1_000_000).optional(),
  price: z.number().finite().min(0).max(1_000_000).optional(),
  startsAt: z.string().max(30),
  endsAt: z.string().max(30),
  order,
  visible: z.boolean(),
});
const serviceSchema = z.object({
  id: slug,
  icon: z.enum(["installation", "maintenance", "repair", "consultation"]),
  title: requiredLocalized,
  description: requiredLocalized,
  image: imagePath,
  points: z.array(requiredLocalized).max(20),
  priceLabel: localized,
  requestMethod: z.enum(["contact", "phone", "whatsapp"]),
  order,
  visible: z.boolean(),
});
const faqSchema = z.object({
  id: slug,
  question: requiredLocalized,
  answer: requiredLocalized,
  order,
  visible: z.boolean(),
});
const policySchema = z.object({
  id: slug,
  title: requiredLocalized,
  body: requiredLocalized,
  order,
  visible: z.boolean(),
});
const linkSchema = z.object({
  id: slug,
  label: requiredLocalized,
  href,
  order,
  visible: z.boolean(),
});
const itemVisibilitySchema = z.object({ id: slug, visible: z.boolean(), order });
const pageSeoSchema = z.object({ title: requiredLocalized, description: requiredLocalized, socialImage: imagePath });

export const siteContentSchema = z.object({
  version: z.literal(2),
  copy: z.array(copySchema).max(500),
  products: z.array(managedProductSchema).min(1).max(200),
  categories: z.array(categorySchema).max(100),
  brands: z.array(brandSchema).max(100),
  offers: z.array(offerSchema).max(100),
  services: z.array(serviceSchema).max(50),
  faqs: z.array(faqSchema).max(100),
  policies: z.object({ notice: requiredLocalized, items: z.array(policySchema).max(100) }),
  settings: z.object({
    phoneDisplay: z.string().trim().min(5).max(30),
    phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
    whatsappE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
    serviceAreaHe: z.string().trim().min(2).max(160),
    serviceAreaAr: z.string().trim().min(2).max(160),
    serviceAreaEn: z.string().trim().min(2).max(160),
    logoImage: imagePath,
    heroImage: imagePath,
    pricesAreIndicative: z.boolean(),
    companyName: requiredLocalized,
    brandDescriptor: requiredLocalized,
    topbarMessage: requiredLocalized,
    email: z.string().trim().max(150).email().or(z.literal("")),
    address: localized,
    businessHours: localized,
    headerCtaHref: href,
    socialLinks: z.array(z.object({ id: slug, label: requiredText.max(50), url: z.string().trim().max(500).url(), visible: z.boolean(), order })).max(20),
  }),
  navigation: z.array(linkSchema).max(30),
  footer: z.object({ links: z.array(linkSchema).max(30) }),
  home: z.object({
    sections: z.array(z.object({ id: z.enum(["hero", "benefits", "featuredProducts", "offers", "serviceStory", "roomCards", "faq", "contact"]), visible: z.boolean(), order })).max(20),
    benefits: z.array(itemVisibilitySchema).max(30),
    heroPrimaryHref: href,
    heroSecondaryHref: href,
    showFaqPreview: z.boolean(),
  }),
  about: z.object({
    storyImage: imagePath,
    values: z.array(z.object({ id: slug, icon: z.enum(["fit", "craft", "communication"]), title: requiredLocalized, description: requiredLocalized, order, visible: z.boolean() })).max(20),
  }),
  servicePage: z.object({
    process: z.array(z.object({ id: slug, title: requiredLocalized, description: requiredLocalized, order, visible: z.boolean() })).max(20),
    showFaq: z.boolean(),
    showContact: z.boolean(),
  }),
  faqPage: z.object({ showOnHome: z.boolean(), showOnServices: z.boolean(), showContact: z.boolean() }),
  seo: z.object({
    defaultTitle: requiredLocalized,
    defaultDescription: requiredLocalized,
    shareImage: imagePath,
    pages: z.object({
      home: pageSeoSchema,
      products: pageSeoSchema,
      services: pageSeoSchema,
      about: pageSeoSchema,
      contact: pageSeoSchema,
      faq: pageSeoSchema,
      policies: pageSeoSchema,
    }),
  }),
  theme: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    ink: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
}).superRefine((content, context) => {
  const unique = (items: Array<{ id: string }>, label: string) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) context.addIssue({ code: "custom", path: [label, index, "id"], message: `${label} IDs must be unique.` });
      seen.add(item.id);
    });
  };
  unique(content.copy, "copy");
  unique(content.products, "products");
  unique(content.categories, "categories");
  unique(content.brands, "brands");
  unique(content.offers, "offers");
  unique(content.services, "services");
  unique(content.faqs, "faqs");
  unique(content.policies.items, "policies.items");
  unique(content.navigation, "navigation");
  unique(content.footer.links, "footer.links");
  for (const [index, product] of content.products.entries()) {
    if (!content.brands.some((brand) => brand.id === product.brandId)) context.addIssue({ code: "custom", path: ["products", index, "brandId"], message: "Select an existing brand." });
    if (!content.categories.some((category) => category.id === product.categoryId)) context.addIssue({ code: "custom", path: ["products", index, "categoryId"], message: "Select an existing category." });
  }
  for (const [index, offer] of content.offers.entries()) {
    if (offer.productId && !content.products.some((product) => product.id === offer.productId)) context.addIssue({ code: "custom", path: ["offers", index, "productId"], message: "Select an existing product or leave the product empty." });
    if (offer.oldPrice !== undefined && offer.price !== undefined && offer.price > offer.oldPrice) context.addIssue({ code: "custom", path: ["offers", index, "price"], message: "The offer price should not exceed the previous price." });
  }
});
