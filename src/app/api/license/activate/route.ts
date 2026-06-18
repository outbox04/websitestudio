import { authenticatedUser, cachePayload, licenseJson, licenseOptions, normalizeLicenseKey } from "../_shared";

export function OPTIONS() {
  return licenseOptions();
}

export async function POST(request: Request) {
  const auth = await authenticatedUser(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const licenseKey = normalizeLicenseKey(body.licenseKey);
    const deviceId = String(body.deviceId || "").trim();
    const deviceName = String(body.deviceName || "").trim();
    const platform = String(body.platform || "").trim();

    if (!licenseKey || !deviceId) {
      return licenseJson({ ok: false, message: "Missing licenseKey or deviceId" }, 400);
    }

    const supabase = auth.supabase;
    const user = auth.user;
    const { data: license, error: licenseError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (licenseError) throw licenseError;
    if (!license) return licenseJson({ ok: false, message: "License không tồn tại." }, 404);
    if (license.status !== "active") return licenseJson({ ok: false, message: "License chưa active." }, 403);
    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      return licenseJson({ ok: false, message: "License đã hết hạn." }, 403);
    }
    if (license.user_id && license.user_id !== user.id) {
      return licenseJson({ ok: false, message: "License đã được gắn với tài khoản khác." }, 403);
    }

    const { count, error: countError } = await supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("license_id", license.id)
      .eq("status", "active");
    if (countError) throw countError;

    const { data: existingDevice, error: deviceLookupError } = await supabase
      .from("devices")
      .select("*")
      .eq("license_id", license.id)
      .eq("device_id", deviceId)
      .maybeSingle();
    if (deviceLookupError) throw deviceLookupError;

    const maxDevices = Number(license.max_devices || 1);
    if (!existingDevice && (count || 0) >= maxDevices) {
      return licenseJson({ ok: false, message: "License đã đạt giới hạn thiết bị." }, 403);
    }

    const { data: updatedLicense, error: updateLicenseError } = await supabase
      .from("licenses")
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", license.id)
      .select("*")
      .single();
    if (updateLicenseError) throw updateLicenseError;

    const { error: upsertDeviceError } = await supabase.from("devices").upsert(
      {
        license_id: license.id,
        user_id: user.id,
        device_id: deviceId,
        device_name: deviceName,
        platform,
        status: "active",
        activated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "license_id,device_id" },
    );
    if (upsertDeviceError) throw upsertDeviceError;

    return licenseJson({
      ok: true,
      license: cachePayload(updatedLicense, deviceId),
    });
  } catch (error) {
    return licenseJson({ ok: false, message: error instanceof Error ? error.message : String(error) }, 500);
  }
}
