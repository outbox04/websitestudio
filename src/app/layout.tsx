import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";

const heading = Be_Vietnam_Pro({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Lumi Concept Studio | Chụp ảnh concept chuyên nghiệp",
    template: "%s | Lumi Concept Studio",
  },
  description: "Studio chụp ảnh concept, quản lý album khách hàng và tạo ảnh AI theo workflow chuyên nghiệp.",
  openGraph: {
    title: "Lumi Concept Studio",
    description: "Chụp ảnh concept trong studio với album riêng, chọn ảnh chỉnh sửa và AI concept generator.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-[#07080a] text-[#f8f5ee] antialiased">{children}</body>
    </html>
  );
}
