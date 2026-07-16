import { TloraSettingsManager } from "@/components/tlora-cms/tlora-settings-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraSiteSettings } from "@/repositories/tlora/settings-repository";

export const dynamic = "force-dynamic";

export default async function TloraSettingsPage() {
  const context = await requireTloraAdmin();
  return <TloraSettingsManager initialSettings={(await getTloraSiteSettings(context.studio.id)).draft} />;
}

