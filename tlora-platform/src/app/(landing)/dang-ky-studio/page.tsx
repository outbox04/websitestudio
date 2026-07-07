import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";

export const metadata: Metadata = {
  title: "Đăng ký Studio Platform",
  description: "Landing page đăng ký website subdomain, trang quản trị và hệ thống chọn ảnh trực tuyến cho studio.",
};

export default function StudioRegistrationLandingPage() { return <RegistrationWizard />; }
