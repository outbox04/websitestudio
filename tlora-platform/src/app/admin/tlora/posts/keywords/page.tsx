import { TloraPostsSubnav } from "@/components/tlora-cms/tlora-posts-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraPosts } from "@/repositories/tlora/posts-repository";

export const dynamic = "force-dynamic";
export default async function PostKeywordsPage() {
  const context = await requireTloraAdmin();
  const posts = await listTloraPosts(context.studio.id);
  const counts = new Map<string, number>();
  posts.flatMap((post) => post.keywords).forEach((keyword) => counts.set(keyword, (counts.get(keyword) || 0) + 1));
  return <><TloraPostsSubnav /><main className="min-h-screen bg-[#f4f4f2] p-6 text-zinc-950"><h1 className="text-3xl font-extrabold">Từ khóa</h1><p className="mt-2 text-sm text-zinc-600">Tổng hợp từ khóa đang được sử dụng trong tất cả bài viết.</p><div className="mt-6 max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-zinc-50"><tr><th className="p-4">Từ khóa</th><th>Số bài sử dụng</th></tr></thead><tbody className="divide-y">{Array.from(counts.entries()).sort((a,b) => b[1]-a[1]).map(([keyword,count]) => <tr key={keyword}><td className="p-4 font-bold">{keyword}</td><td>{count}</td></tr>)}</tbody></table></div></main></>;
}
