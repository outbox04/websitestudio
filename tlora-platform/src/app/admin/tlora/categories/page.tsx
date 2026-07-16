import { TloraCategoriesManager } from "@/components/tlora-cms/tlora-categories-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraCategories } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";

export default async function TloraCategoriesPage() {
  const context = await requireTloraAdmin();
  return <TloraCategoriesManager initialCategories={await listTloraCategories(context.studio.id)} />;
}

