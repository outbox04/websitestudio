import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-body",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "TLORA Studio | Chụp ảnh concept & album online",
    template: "%s | TLORA Studio",
  },
  description: "TLORA Studio chụp ảnh concept cá nhân, quản lý album khách hàng và chọn ảnh online chuyên nghiệp.",
  applicationName: "TLORA Studio",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon", sizes: "32x32", type: "image/png" }, { url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "TLORA Studio | Chụp ảnh concept & album online",
    description: "Chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng tại TLORA Studio.",
    type: "website",
    url: "/",
    siteName: "TLORA Studio",
    locale: "vi_VN",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TLORA Studio — Chụp ảnh concept và album online" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TLORA Studio | Chụp ảnh concept & album online",
    description: "Chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng tại TLORA Studio.",
    images: [{ url: "/opengraph-image", alt: "TLORA Studio — Chụp ảnh concept và album online" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14110f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`h-full scroll-smooth ${inter.variable}`}>
      <body className="min-h-full bg-[#07080a] text-[#f8f5ee] antialiased">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
