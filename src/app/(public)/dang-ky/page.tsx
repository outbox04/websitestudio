import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Khởi tạo TLORA Studio OS",
  description: "Đăng ký TLORA Studio OS — tlora-studio-os: Website, quản lý ảnh, chọn ảnh online và Cloud Storage dành riêng cho studio ảnh.",
  openGraph: {
    title: "Khởi tạo TLORA Studio OS",
    description: "Đăng ký TLORA Studio OS — tlora-studio-os: Website, quản lý ảnh, chọn ảnh online và Cloud Storage dành riêng cho studio ảnh.",
    images: ["/brand/tlora-logo.png"],
  },
};
export default function RegistrationPage() { redirect("/dang-ky-studio"); }
