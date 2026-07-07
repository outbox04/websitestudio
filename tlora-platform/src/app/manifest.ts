import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TLORA Studio — Chụp ảnh concept & album online",
    short_name: "TLORA Studio",
    description: "Chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng.",
    start_url: "/",
    display: "standalone",
    background_color: "#14110f",
    theme_color: "#14110f",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
