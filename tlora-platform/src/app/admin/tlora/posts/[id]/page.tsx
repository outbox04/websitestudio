import { notFound } from "next/navigation";
import { TloraPostEditor } from "@/components/tlora-cms/tlora-post-editor";
import { TloraPostsSubnav } from "@/components/tlora-cms/tlora-posts-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraMedia } from "@/repositories/tlora/media-repository";
import { listTloraCategories, listTloraPosts } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireTloraAdmin();
  const [posts, categories, media] = await Promise.all([listTloraPosts(context.studio.id), listTloraCategories(context.studio.id), listTloraMedia(context.studio.id)]);
  const post = posts.find((item) => item.id === id);
  if (!post) notFound();
  const keywordSuggestions: Record<string, number> = {};
  posts.flatMap((item) => item.keywords).forEach((keyword) => { keywordSuggestions[keyword] = (keywordSuggestions[keyword] || 0) + 1; });
  return <><TloraPostsSubnav /><TloraPostEditor post={post} categories={categories} initialMedia={media} keywordSuggestions={keywordSuggestions} /></>;
}
