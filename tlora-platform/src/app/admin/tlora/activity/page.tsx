import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraActivity } from "@/repositories/tlora/activity-repository";

export const dynamic = "force-dynamic";

export default async function TloraActivityPage() {
  const context = await requireTloraAdmin();
  const activity = await listTloraActivity(context.studio.id);
  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Audit trail</p><h1 className="mt-2 text-3xl font-extrabold">Lịch sử hoạt động</h1>
      <section className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-[170px_1fr_1fr] gap-4 border-b border-zinc-200 px-5 py-3 text-xs font-bold uppercase text-zinc-500"><span>Thời gian</span><span>Hành động</span><span>Đối tượng</span></div>
        <div className="divide-y divide-zinc-100">{activity.map((item) => <div key={item.id} className="grid grid-cols-[170px_1fr_1fr] gap-4 px-5 py-4 text-sm"><span className="text-zinc-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</span><span className="font-bold">{item.action}</span><span className="truncate text-zinc-600">{item.entityType} · {item.entityId || "-"}</span></div>)}{!activity.length && <p className="p-8 text-center text-sm text-zinc-500">Chưa có hoạt động CMS.</p>}</div>
      </section>
    </main>
  );
}

