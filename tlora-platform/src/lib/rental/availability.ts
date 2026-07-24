import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRentalProduct, type RentalProduct } from "./catalog";

export type PublicSizeAvailability = Record<string, boolean>;

function fallbackAvailability(product: RentalProduct): PublicSizeAvailability {
  const available = product.status === "available";
  return Object.fromEntries(product.sizes.map((size) => [size, available]));
}

export async function getSizeAvailability(productId: string): Promise<PublicSizeAvailability> {
  const product = getRentalProduct(productId);
  if (!product) return {};

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("rental_inventory")
      .select("size,is_available")
      .eq("product_id", product.id);
    if (error) throw error;
    const result = fallbackAvailability(product);
    for (const row of data || []) result[String(row.size)] = Boolean(row.is_available);
    return result;
  } catch {
    // The rental module remains usable before the optional inventory migration is applied.
    return fallbackAvailability(product);
  }
}

export async function setSizeAvailability(productId: string, size: string, isAvailable: boolean, userId?: string) {
  const product = getRentalProduct(productId);
  if (!product || !product.sizes.includes(size)) throw new Error("Sản phẩm hoặc size không hợp lệ.");
  const supabase = createAdminClient();
  const { error } = await supabase.from("rental_inventory").upsert({
    product_id: product.id,
    size,
    is_available: isAvailable,
    updated_by: userId || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "product_id,size" });
  if (error) throw error;
}
