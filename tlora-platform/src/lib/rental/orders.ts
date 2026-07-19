import { allRentalItems, type RentalProduct } from "./catalog";
import { RENTAL_DEPOSIT_RATE } from "./config";

export type RentalOrderInputItem = { productId: string; size: string; color: string; quantity: number };
export type CanonicalRentalItem = RentalOrderInputItem & { name: string; slug: string; image: string; type: "costume" | "accessory"; unitPrice: number };
export function rentalDiscount(code: string) { return ["TLORA10", "RENTAL10"].includes(code.trim().toUpperCase()) ? .1 : 0; }
export function canonicalRentalItems(items: RentalOrderInputItem[]) {
  return items.map((item) => {
    const product = allRentalItems.find((value) => value.id === item.productId);
    if (!product) throw new Error("Sản phẩm không tồn tại.");
    if (!product.sizes.includes(item.size) || item.color !== product.color) throw new Error(`Tùy chọn ${product.name} không hợp lệ.`);
    const quantity = Math.max(1, Math.min(5, Math.round(item.quantity)));
    return { productId: product.id, name: product.name, slug: product.slug, image: product.images[0], type: product.type, size: item.size, color: item.color, quantity, unitPrice: product.price } satisfies CanonicalRentalItem;
  });
}
export function rentalTotals(items: CanonicalRentalItem[], durationDays: number, promoCode = "") {
  const safeDuration = Math.max(.5, Math.min(5.5, Math.round(durationDays * 2) / 2));
  const beforeDiscount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity * safeDuration, 0);
  const discount = Math.round(beforeDiscount * rentalDiscount(promoCode));
  const total = Math.max(0, beforeDiscount - discount);
  const deposit = Math.round(total * RENTAL_DEPOSIT_RATE);
  return { durationDays: safeDuration, beforeDiscount, discount, total, deposit, remaining: total - deposit };
}
export function publicRentalOrder(order: Record<string, unknown>) { return { orderCode: order.order_code, status: order.status, customerName: order.customer_name, phone: order.phone, pickupAt: order.pickup_at, durationDays: order.duration_days, items: order.items, totalVnd: order.total_vnd, depositVnd: order.deposit_vnd, paidDepositVnd: order.paid_deposit_vnd, remainingVnd: order.remaining_vnd, promoCode: order.promo_code, originalCostumeCount: order.original_costume_count, removedCostumeCount: order.removed_costume_count, createdAt: order.created_at }; }
export type { RentalProduct };
