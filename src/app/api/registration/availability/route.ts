import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const username = url.searchParams.get("username")?.trim().toLowerCase();
  const phone = url.searchParams.get("phone")?.replace(/\s/g, "");
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const requestedDomain = url.searchParams.get("domain")?.trim().toLowerCase();
  const domainSuffix = `.${rootDomain}`;
  const domainSlug = requestedDomain?.endsWith(domainSuffix) ? requestedDomain.slice(0, -domainSuffix.length) : "";
  const basicDomain = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domainSlug) ? requestedDomain : undefined;
  if (!email && !username && !phone && !basicDomain) return NextResponse.json({ emailTaken: false, usernameTaken: false, phoneTaken: false, domainTaken: false });
  try {
    const admin = createAdminClient();
    const [profileResult, orderResult, profileUsernameResult, profilePhoneResult, orderPhoneResult, authUsersResult, studioDomainResult, orderDomainResult] = await Promise.all([
      email ? admin.from("profiles").select("id").eq("email", email).maybeSingle() : Promise.resolve({ data: null, error: null }),
      username ? admin.from("studio_payment_orders").select("id").eq("username", username).maybeSingle() : Promise.resolve({ data: null, error: null }),
      username ? admin.from("profiles").select("id").eq("username", username).maybeSingle() : Promise.resolve({ data: null, error: null }),
      phone ? admin.from("profiles").select("id").eq("phone", phone).maybeSingle() : Promise.resolve({ data: null, error: null }),
      phone ? admin.from("studio_payment_orders").select("id").eq("phone", phone).in("status", ["pending", "paid"]).maybeSingle() : Promise.resolve({ data: null, error: null }),
      email || username ? admin.auth.admin.listUsers({ page: 1, perPage: 1000 }) : Promise.resolve({ data: { users: [] }, error: null }),
      basicDomain ? admin.from("studios").select("id").or(`slug.eq.${domainSlug},primary_domain.eq.${basicDomain}`).maybeSingle() : Promise.resolve({ data: null, error: null }),
      basicDomain ? admin.from("studio_payment_orders").select("id").eq("domain", basicDomain).in("status", ["pending", "paid"]).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (profileResult.error || orderResult.error || profileUsernameResult.error || profilePhoneResult.error || orderPhoneResult.error || authUsersResult.error || studioDomainResult.error || orderDomainResult.error) {
      throw profileResult.error || orderResult.error || profileUsernameResult.error || profilePhoneResult.error || orderPhoneResult.error || authUsersResult.error || studioDomainResult.error || orderDomainResult.error;
    }
    const authEmailTaken = Boolean(email) && authUsersResult.data.users.some((user) => user.email?.toLowerCase() === email);
    const authUsernameTaken = Boolean(username) && authUsersResult.data.users.some((user) => String(user.user_metadata.username || "").toLowerCase() === username);
    return NextResponse.json({
      emailTaken: Boolean(profileResult.data || authEmailTaken),
      usernameTaken: Boolean(orderResult.data || profileUsernameResult.data || authUsernameTaken),
      phoneTaken: Boolean(profilePhoneResult.data || orderPhoneResult.data),
      domainTaken: Boolean(studioDomainResult.data || orderDomainResult.data),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không kiểm tra được dữ liệu." }, { status: 500 });
  }
}
