import type { MetadataRoute } from "next";
import { RENTAL_ENABLED } from "@/lib/rental/config";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://tlora.net").replace(/\/$/, "");

const pages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/dich-vu", changeFrequency: "monthly", priority: 0.9 },
  { path: "/bang-gia", changeFrequency: "monthly", priority: 0.9 },
  ...(RENTAL_ENABLED ? [
    { path: "/thue-trang-phuc", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/thue-trang-phuc/san-pham", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/thue-trang-phuc/tra-cuu", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/thue-trang-phuc/chinh-sua", changeFrequency: "monthly" as const, priority: 0.3 },
  ] : []),
  { path: "/album-concept", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tin-tuc", changeFrequency: "weekly", priority: 0.7 },
  { path: "/dang-ky", changeFrequency: "monthly", priority: 0.6 },
  { path: "/chinh-sach-bao-mat", changeFrequency: "yearly", priority: 0.3 },
  { path: "/dieu-khoan-dich-vu", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
