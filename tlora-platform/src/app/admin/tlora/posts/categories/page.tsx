import { TloraCategoriesManager } from "@/components/tlora-cms/tlora-categories-manager";
import { TloraPostsSubnav } from "@/components/tlora-cms/tlora-posts-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraCategories } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";
export default async function PostCategoriesPage() {
  const context = await requireTloraAdmin();
  return <><TloraPostsSubnav /><TloraCategoriesManager initialCategories={await listTloraCategories(context.studio.id)} /></>;
}
