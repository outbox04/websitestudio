import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TLORA Website CMS",
  description: "Quản trị website và album khách hàng trong TLORA Website CMS.",
};

export default function AdminStudioPage() {
  redirect("/admin/tlora/customer-galleries");
}
