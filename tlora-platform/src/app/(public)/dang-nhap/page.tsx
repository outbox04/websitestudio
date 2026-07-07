import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập cổng khách hàng và admin TLORA Studio.",
  openGraph: {
    title: "Đăng nhập",
    description: "Đăng nhập cổng khách hàng và admin TLORA Studio.",
    images: ["/brand/tlora-logo.png"],
  },
};

export default function LoginPage() {
  return (
    <section className="grid min-h-[calc(100vh-73px)] place-items-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
