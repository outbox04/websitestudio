import { NextResponse } from "next/server";
import { z } from "zod";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { setSizeAvailability } from "@/lib/rental/availability";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";

const updateAvailabilitySchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  isAvailable: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = updateAvailabilitySchema.parse(await request.json());
    await setSizeAvailability(input.productId, input.size, input.isAvailable, context.userId || undefined);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return tloraApiError(error);
  }
}
