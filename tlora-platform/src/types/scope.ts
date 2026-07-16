export type RequestScope = "platform" | "tlora" | "studio";
export type StudioType = "first_party" | "tenant";
export type StudioRole = "owner" | "admin" | "staff";

export type PlatformStudio = {
  id: string;
  slug: string;
  displayName: string;
  studioType: StudioType;
  systemKey: string | null;
  status: "pending" | "active" | "suspended" | "cancelled";
  settings: Record<string, unknown>;
};

export type RequestContext = {
  scope: RequestScope;
  studio: PlatformStudio | null;
  userId: string | null;
  membershipRole: StudioRole | null;
  isPlatformAdmin: boolean;
  hostname: string;
};

export type TloraCmsPage = {
  id: string;
  pageKey: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  publishedAt: string | null;
};

export type TloraCmsSection = {
  id: string;
  pageId: string;
  sectionKey: string;
  sectionType: string;
  draftContent: Record<string, unknown>;
  publishedContent: Record<string, unknown>;
  schemaVersion: number;
  isEnabled: boolean;
  sortOrder: number;
};

export type TloraCmsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  keywords: string[];
  categoryIds: string[];
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  updatedAt: string;
};

export type TloraCmsCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type TloraCmsMediaAsset = {
  id: string;
  storagePath: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
};

export type TloraCmsMenuItem = {
  id?: string;
  label: string;
  href: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type TloraCmsMenu = {
  id: string;
  menuKey: string;
  name: string;
  items: TloraCmsMenuItem[];
};

export type StudioGallery = {
  id: string;
  studioId: string;
  customerName: string;
  customerSlug: string;
  shareToken: string;
};

export type StudioGalleryPhoto = {
  id: string;
  galleryId: string;
  fileName: string;
  kind: "raw" | "edited";
  selected: boolean;
  editNote: string | null;
};

export type StudioDriveConnection = {
  studioId: string;
  googleAccountEmail: string | null;
  rootFolderId: string;
  tokenExpiresAt: string | null;
};
