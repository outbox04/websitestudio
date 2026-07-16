import { TloraPostEditor } from "@/components/tlora-cms/tlora-post-editor";
import { TloraPostsSubnav } from "@/components/tlora-cms/tlora-posts-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraMedia } from "@/repositories/tlora/media-repository";
import { listTloraCategories, listTloraPosts } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";
export default async function NewPostPage() {
  const context = await requireTloraAdmin();
  const [categories, media, posts] = await Promise.all([listTloraCategories(context.studio.id), listTloraMedia(context.studio.id), listTloraPosts(context.studio.id)]);
  return <><TloraPostsSubnav /><TloraPostEditor categories={categories} initialMedia={media} keywordSuggestions={keywordCounts(posts)} /></>;
}
function keywordCounts(posts: Awaited<ReturnType<typeof listTloraPosts>>) { const values: Record<string,number>={}; posts.flatMap(post=>post.keywords).forEach(keyword=>{values[keyword]=(values[keyword]||0)+1;}); return values; }
