import { TloraMediaManager } from "@/components/tlora-cms/tlora-media-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraMedia } from "@/repositories/tlora/media-repository";

export const dynamic = "force-dynamic";

export default async function TloraMediaPage() {
  const context = await requireTloraAdmin();
  return <TloraMediaManager initialMedia={await listTloraMedia(context.studio.id)} />;
}

