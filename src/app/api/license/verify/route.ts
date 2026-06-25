import { authenticatedUser, cachePayload, expiredLicensePayload, isLicenseExpired, licenseJson, licenseOptions } from "../_shared";

export function OPTIONS() {
  return licenseOptions();
}

export async function POST(request: Request) {
  const auth = await authenticatedUser(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const deviceId = String(body.deviceId || "").trim();
    const deviceName = String(body.deviceName || "").trim();
    const platform = String(body.platform || "").trim();
    if (!deviceId) {
      return licenseJson({ ok: false, message: "Missing deviceId" }, 400);
    }

    const supabase = auth.supabase;
    const user = auth.user;
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*, licenses(*)")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .eq("status", "active")
      .maybeSingle();

    if (deviceError) throw deviceError;
    if (!device || !device.licenses) {
      return licenseJson({ ok: false, message: "Thiết bị chưa được kích hoạt license." }, 403);
    }

    const license = device.licenses;
    if (license.status === "expired" || isLicenseExpired(license)) {
      if (license.status !== "expired") {
        await supabase.from("licenses").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", license.id);
      }
      return licenseJson(expiredLicensePayload(license), 403);
    }
    if (license.status !== "active") {
      return licenseJson({ ok: false, message: "License không còn active." }, 403);
    }

    await supabase
      .from("devices")
      .update({
        device_name: deviceName || device.device_name,
        platform: platform || device.platform,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", device.id);

    return licenseJson({
      ok: true,
      license: cachePayload(license, deviceId),
    });
  } catch (error) {
    return licenseJson({ ok: false, message: error instanceof Error ? error.message : String(error) }, 500);
  }
}
