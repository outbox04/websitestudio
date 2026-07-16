import { TloraMenuManager } from "@/components/tlora-cms/tlora-menu-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraMenu } from "@/repositories/tlora/menus-repository";

export const dynamic = "force-dynamic";

export default async function TloraMenusPage() {
  const context = await requireTloraAdmin();
  return <TloraMenuManager initialMenu={await getTloraMenu(context.studio.id)} />;
}

