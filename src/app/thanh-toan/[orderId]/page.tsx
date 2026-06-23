import type { Metadata } from "next";
import { PaymentReceipt } from "@/components/payment-receipt";

export const metadata: Metadata = {
  title: "Xác nhận thanh toán thành công",
  description: "Biên nhận thanh toán dịch vụ hoặc đăng ký tài khoản TLORA Studio.",
  openGraph: {
    title: "Xác nhận thanh toán thành công",
    description: "Biên nhận thanh toán dịch vụ hoặc đăng ký tài khoản TLORA Studio.",
    images: ["/brand/tlora-logo.png"],
  },
};

export default async function PaymentSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PaymentReceipt orderId={orderId} />;
}
