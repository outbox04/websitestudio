import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Montserrat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
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
    <html lang="vi" className={`h-full scroll-smooth ${inter.variable} ${cormorant.variable} ${montserrat.variable}`}>
      <body className="min-h-full bg-[#07080a] text-[#f8f5ee] antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
