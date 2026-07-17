import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { listTloraCmsUsers } from "@/lib/tlora-cms-users";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";

function strongPassword() {
  return `${randomBytes(8).toString("base64url")}!Aa7`;
}

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ users: await listTloraCmsUsers(context.studio.id) });
  } catch (error) { return tloraApiError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const body = await request.json() as { name?: string; backupEmail?: string; account?: string };
    const name = String(body.name || "").trim();
    const base = String(body.account || "").trim().toLowerCase().replace(/^tlora\./, "").replace(/[^a-z0-9._-]/g, "");
    if (!name || !base) return NextResponse.json({ error: "Tên và tài khoản là bắt buộc." }, { status: 400 });
    const username = `tlora.${base}`;
    const authEmail = `${username.replace(/\./g, "-")}@accounts.tlgroup.site`;
    const password = strongPassword();
    const admin = createAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({ email: authEmail, password, email_confirm: true, user_metadata: { full_name: name, username } });
    if (error || !created.user) throw error || new Error("Không thể tạo tài khoản.");
    try {
      await admin.from("profiles").upsert({ id: created.user.id, email: authEmail, full_name: name, username, role: "user", is_active: true }, { onConflict: "id" }).throwOnError();
      await admin.from("studio_members").upsert({ studio_id: context.studio.id, user_id: created.user.id, role: "staff", is_active: true }, { onConflict: "studio_id,user_id" }).throwOnError();
      await admin.from("tlora_cms_users").insert({ user_id: created.user.id, studio_id: context.studio.id, username, display_name: name, backup_email: body.backupEmail || null, created_by: context.userId }).throwOnError();
    } catch (insertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw insertError;
    }
    return NextResponse.json({ credentials: { name, username, password, backupEmail: body.backupEmail || "" } }, { status: 201 });
  } catch (error) { return tloraApiError(error); }
}
