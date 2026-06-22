import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";

export const metadata: Metadata = { title: "Khởi tạo Studio Platform", description: "Đăng ký TLORA Studio Platform: Website, quản lý ảnh, chọn ảnh online và Cloud Storage cho studio." };
export default function RegistrationPage() { return <RegistrationWizard />; }
