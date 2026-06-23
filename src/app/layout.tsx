import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import "./globals.css";

const body = Google_Sans({
  variable: "--font-body",
  subsets: ["vietnamese"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const code = Google_Sans_Code({
  variable: "--font-code",
  subsets: ["vietnamese"],
  weight: "variable",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "TLORA Studio | Nơi cá tính trở thành nghệ thuật",
    template: "%s | TLORA Studio",
  },
  description: "TLORA Studio chụp ảnh concept, quản lý album khách hàng và tạo ảnh AI theo workflow chuyên nghiệp.",
  openGraph: {
    title: "TLORA Studio",
    description: "Nơi cá tính trở thành nghệ thuật, với album riêng, chọn ảnh chỉnh sửa và AI concept generator.",
    type: "website",
    locale: "vi_VN",
    images: ["/brand/tlora-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${body.variable} ${code.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-[#07080a] text-[#f8f5ee] antialiased">{children}</body>
    </html>
  );
}
