import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { renewedExpiry } from "@/app/api/license/_shared";

export const runtime = "nodejs";

const licenseDurationByPlan: Record<string, number> = {
  basic: 30,
  medium: 90,
  premium: 365,
};

function studioSlug(studioName: string, domain: string | null) {
  const fromDomain = (domain || "").split(".")[0];
  const source = fromDomain || studioName;
  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
  return normalized.length >= 3 ? normalized : `studio-${randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { notification_type?: string; order?: { order_invoice_number?: string; order_status?: string; order_amount?: string | number }; transaction?: { transaction_id?: string } };
    const orderId = String(payload.order?.order_invoice_number || "").trim();
    const status = String(payload.order?.order_status || "").toLowerCase();
    const amount = Number(payload.order?.order_amount || 0);
    if (!orderId) return NextResponse.json({ error: "Thiếu mã đơn hàng." }, { status: 400 });
    if (payload.notification_type !== "ORDER_PAID" || !["captured", "paid", "success", "completed"].includes(status)) return NextResponse.json({ ok: true, ignored: true });

    const admin = createAdminClient();
    const { data: gallery, error } = await admin
      .from("customer_galleries")
      .select("id,total_cost_vnd,deposit_paid_vnd")
      .eq("payment_order_id", orderId)
      .maybeSingle();
    if (error) throw error;
    if (!gallery) {
      const { data: studioOrder, error: studioOrderError } = await admin.from("studio_payment_orders").select("id,amount_vnd,studio_name,plan,industry,email,phone,address,username,domain,license_key,activation_email_sent_at,studio_id,owner_user_id").eq("order_id", orderId).maybeSingle();
      if (studioOrderError) throw studioOrderError;
      if (!studioOrder) {
        const { data: renewalOrder, error: renewalOrderError } = await admin
          .from("license_renewal_orders")
          .select("id,amount_vnd,duration_days,status,license_id")
          .eq("order_id", orderId)
          .maybeSingle();
        if (renewalOrderError) throw renewalOrderError;
        if (!renewalOrder) return NextResponse.json({ error: "Không tìm thấy đơn thanh toán." }, { status: 404 });
        if (renewalOrder.status === "paid") return NextResponse.json({ ok: true, orderId, type: "license_renewal", alreadyProcessed: true });
        if (amount && amount !== renewalOrder.amount_vnd) return NextResponse.json({ error: "Số tiền IPN không khớp đơn gia hạn." }, { status: 400 });

        const { data: license, error: renewalLicenseError } = await admin
          .from("licenses")
          .select("*")
          .eq("id", renewalOrder.license_id)
          .single();
        if (renewalLicenseError) throw renewalLicenseError;

        const now = new Date();
        const nextExpiresAt = renewedExpiry(license, renewalOrder.duration_days, now).toISOString();
        const transactionId = String(payload.transaction?.transaction_id || "");
        const { error: updateLicenseError } = await admin
          .from("licenses")
          .update({
            status: "active",
            expires_at: nextExpiresAt,
            last_renewed_at: now.toISOString(),
            renewal_count: Number(license.renewal_count || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq("id", license.id);
        if (updateLicenseError) throw updateLicenseError;

        const { error: updateRenewalError } = await admin
          .from("license_renewal_orders")
          .update({
            status: "paid",
            paid_at: now.toISOString(),
            transaction_id: transactionId,
            previous_expires_at: license.expires_at,
            renewed_expires_at: nextExpiresAt,
            updated_at: now.toISOString(),
          })
          .eq("id", renewalOrder.id);
        if (updateRenewalError) throw updateRenewalError;

        return NextResponse.json({ ok: true, orderId, type: "license_renewal", expiresAt: nextExpiresAt });
      }
      if (amount && amount !== studioOrder.amount_vnd) return NextResponse.json({ error: "Số tiền IPN không khớp đơn Studio." }, { status: 400 });
      let studioId = studioOrder.studio_id;
      if (!studioId) {
        const slug = studioSlug(studioOrder.studio_name, studioOrder.domain);
        const { data: existingStudio, error: existingStudioError } = await admin
          .from("studios")
          .select("id")
          .or(`slug.eq.${slug},primary_domain.eq.${studioOrder.domain || ""}`)
          .maybeSingle();
        if (existingStudioError) throw existingStudioError;
        if (existingStudio) {
          studioId = existingStudio.id;
        } else {
          const { data: createdStudio, error: createStudioError } = await admin
            .from("studios")
            .insert({
              slug,
              display_name: studioOrder.studio_name,
              primary_domain: studioOrder.domain || null,
              plan: studioOrder.plan,
              status: "active",
              owner_user_id: studioOrder.owner_user_id || null,
              settings: { industry: studioOrder.industry || "concept", theme: studioOrder.industry || "concept", email: studioOrder.email || "", phone: studioOrder.phone || "", address: studioOrder.address || "" },
            })
            .select("id")
            .single();
          if (createStudioError) throw createStudioError;
          studioId = createdStudio.id;
        }
      }
      if (studioId && studioOrder.owner_user_id) {
        const { error: memberError } = await admin.from("studio_members").upsert({
          studio_id: studioId, user_id: studioOrder.owner_user_id, role: "owner", is_active: true,
        }, { onConflict: "studio_id,user_id" });
        if (memberError) throw memberError;
        const { error: profileError } = await admin.from("profiles").update({
          default_studio_id: studioId,
          is_active: true,
          role: "admin",
        }).eq("id", studioOrder.owner_user_id);
        if (profileError) throw profileError;
      }
      const licenseKey = studioOrder.license_key || `TLORA-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
      const { data: license, error: licenseError } = await admin.from("licenses").upsert({
        license_key: licenseKey,
        studio_id: studioId || null,
        user_id: studioOrder.owner_user_id || null,
        status: "active",
        plan: studioOrder.plan,
        max_devices: 1,
        duration_days: licenseDurationByPlan[studioOrder.plan] || 30,
        metadata: { orderId, studioName: studioOrder.studio_name, domain: studioOrder.domain || null },
      }, { onConflict: "license_key" }).select("id").single();
      if (licenseError) throw licenseError;
      const { error: updateStudioError } = await admin.from("studio_payment_orders").update({ status: "paid", paid_at: new Date().toISOString(), transaction_id: String((payload as { transaction?: { transaction_id?: string } }).transaction?.transaction_id || ""), license_key: licenseKey, studio_id: studioId, license_id: license.id }).eq("id", studioOrder.id);
      if (updateStudioError) throw updateStudioError;
      return NextResponse.json({ ok: true, orderId, type: "studio" });
    }
    const expectedAmount = Math.max(gallery.total_cost_vnd - gallery.deposit_paid_vnd, 0);
    if (amount && amount !== expectedAmount) return NextResponse.json({ error: "Số tiền IPN không khớp đơn hàng." }, { status: 400 });

    const { error: updateError } = await admin.from("customer_galleries").update({
      payment_status: "paid", paid_at: new Date().toISOString(), raw_download_enabled: true, edited_download_enabled: true,
    }).eq("id", gallery.id);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không xử lý được IPN." }, { status: 500 });
  }
}
