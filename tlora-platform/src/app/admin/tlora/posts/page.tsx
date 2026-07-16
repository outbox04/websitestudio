import { TloraPostsManager } from "@/components/tlora-cms/tlora-posts-manager";
import { TloraPostsSubnav } from "@/components/tlora-cms/tlora-posts-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraCategories, listTloraPosts } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";

export default async function TloraPostsPage() {
  const context = await requireTloraAdmin();
  const [posts, categories] = await Promise.all([
    listTloraPosts(context.studio.id),
    listTloraCategories(context.studio.id),
  ]);
  return <><TloraPostsSubnav /><TloraPostsManager initialPosts={posts} categories={categories} /></>;
}
