import { z } from "zod";

const text = z.string().trim().max(5000);
const shortText = z.string().trim().max(240);
const safeHref = z.string().trim().max(2048).refine(
  (value) => value.startsWith("/") || value.startsWith("#") || /^https?:\/\//i.test(value),
  "Liên kết phải là đường dẫn nội bộ, anchor hoặc URL http(s).",
);
const imageUrl = z.string().trim().max(500_000).refine(
  (value) => !value || value.startsWith("/") || value.startsWith("data:image/") || /^https:\/\//i.test(value),
  "Ảnh phải là đường dẫn nội bộ, data image hoặc URL HTTPS.",
);
const textOverrides = z.record(z.string().max(160), text).optional().default({});
const imageOverrides = z.record(z.string().max(160), imageUrl).optional().default({});

const heroContent = z.object({
  title: shortText,
  description: text,
  image: imageUrl.optional().default(""),
  ctaLabel: shortText.optional().default(""),
  ctaHref: safeHref.optional().default("#"),
  text: textOverrides,
  images: imageOverrides,
});

const editorialContent = z.object({
  title: shortText,
  description: text,
  image: imageUrl.optional().default(""),
  text: textOverrides,
  images: imageOverrides,
});

const collectionItem = z.object({
  title: shortText,
  description: text.optional().default(""),
  subtitle: shortText.optional().default(""),
  image: imageUrl.optional().default(""),
  href: safeHref.optional().default("#"),
});

const collectionContent = z.object({
  title: shortText,
  description: text.optional().default(""),
  items: z.array(collectionItem).max(24).default([]),
  text: textOverrides,
  images: imageOverrides,
});

const contactContent = z.object({
  title: shortText,
  description: text.optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  address: text.optional().default(""),
  text: textOverrides,
  images: imageOverrides,
});

export const sectionContentSchemas = {
  hero: heroContent,
  editorial: editorialContent,
  collection: collectionContent,
  gallery: collectionContent,
  contact: contactContent,
} as const;

export const updateSectionSchema = z.object({
  sectionId: z.string().uuid(),
  sectionType: z.enum(["hero", "editorial", "collection", "gallery", "contact"]),
  content: z.record(z.string(), z.unknown()),
  isEnabled: z.boolean(),
});

export const publishPageSchema = z.object({
  pageId: z.string().uuid(),
  changeNote: z.string().trim().max(500).optional(),
});

export const updatePageMetaSchema = z.object({
  pageId: z.string().uuid(),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(200),
  ogImageUrl: imageUrl,
});

export const cmsPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(240),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  excerpt: z.string().trim().max(320).optional().default(""),
  body: z.string().trim().max(100_000).optional().default(""),
  coverImageUrl: imageUrl.optional().default(""),
  keywords: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  categoryIds: z.array(z.string().uuid()).max(10).default([]),
});

export const publishPostSchema = z.object({
  postId: z.string().uuid(),
  changeNote: z.string().trim().max(500).optional(),
});

export const cmsCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(500).optional().default(""),
});

export const cmsMediaMetadataSchema = z.object({
  altText: z.string().trim().max(300).optional().default(""),
});

export const cmsMenuItemSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  href: safeHref,
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000),
});

export const cmsMenuSchema = z.object({
  menuId: z.string().uuid(),
  items: z.array(cmsMenuItemSchema).max(30),
});

export const cmsSiteSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(320),
  phone: z.string().trim().max(40),
  email: z.string().trim().email().or(z.literal("")),
  address: z.string().trim().max(500),
  facebookUrl: safeHref.or(z.literal("")),
  zalo: z.string().trim().max(40),
  defaultOgImage: imageUrl,
});

export const conceptAlbumSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  excerpt: z.string().trim().max(500),
  coverImageUrl: imageUrl,
  images: z.array(imageUrl).max(30),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
  status: z.enum(["draft", "published", "archived"]),
});

export const conceptInquirySchema = z.object({
  albumId: z.string().uuid().nullable().optional(),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  note: z.string().trim().max(1000).optional().default(""),
});

export function parseSectionContent(sectionType: keyof typeof sectionContentSchemas, content: unknown) {
  return sectionContentSchemas[sectionType].parse(content);
}
