import { PaymentReceipt } from "@/components/payment-receipt";

export default async function PaymentSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PaymentReceipt orderId={orderId} />;
}
