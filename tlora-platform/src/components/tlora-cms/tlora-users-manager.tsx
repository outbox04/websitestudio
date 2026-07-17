"use client";

import { Copy, Download, Plus, X } from "lucide-react";
import { useState } from "react";

type TloraCmsUserRow = {
  user_id: string;
  username: string;
  display_name: string;
  backup_email: string | null;
  role: "owner" | "admin" | "staff";
  is_active: boolean;
  postCount: number;
  source: "cms" | "studio";
};

type Credentials = { name: string; username: string; password: string; backupEmail: string };

const roleLabels: Record<TloraCmsUserRow["role"], string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  staff: "Biên tập viên",
};

export function TloraUsersManager({ initialUsers }: { initialUsers: TloraCmsUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", backupEmail: "", account: "" });
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tlora/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { credentials?: Credentials; error?: string };
      if (!response.ok || !result.credentials) {
        setMessage(result.error || "Không thể tạo người dùng.");
        return;
      }
      setCredentials(result.credentials);
      const refreshed = await fetch("/api/admin/tlora/users");
      const data = await refreshed.json() as { users: TloraCmsUserRow[] };
      setUsers(data.users);
    } finally {
      setCreating(false);
    }
  }

  function download() {
    if (!credentials) return;
    const text = `Tên: ${credentials.name}\nTài khoản: ${credentials.username}\nMật khẩu: ${credentials.password}\nEmail backup: ${credentials.backupEmail}\n\nĐịnh dạng: ${credentials.username}|${credentials.password}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${credentials.username}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-6 text-zinc-950">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Người dùng</h1>
          <p className="mt-2 text-sm text-zinc-600">Đồng bộ thành viên admin-studio và tài khoản biên tập Website CMS.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white">
          <Plus size={17} /> Thêm người dùng
        </button>
      </header>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="p-4">Tài khoản</th>
              <th className="p-4">Tên</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Email backup</th>
              <th className="p-4">Nguồn</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Bài viết</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="p-4 font-mono font-bold">{user.username}</td>
                <td className="p-4">{user.display_name}</td>
                <td className="p-4">{roleLabels[user.role]}</td>
                <td className="p-4">{user.backup_email || "—"}</td>
                <td className="p-4">{user.source === "cms" ? "Website CMS" : "admin-studio"}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>
                    {user.is_active ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td className="p-4">{user.postCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <section className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-black">Thêm người dùng</h2>
              <button aria-label="Đóng" onClick={() => setOpen(false)}><X /></button>
            </div>
            {credentials ? (
              <div className="mt-5 space-y-3">
                <Credential label="Tài khoản" value={credentials.username} />
                <Credential label="Mật khẩu" value={credentials.password} />
                <p className="text-xs text-zinc-500">Định dạng: {credentials.username}|{credentials.password}</p>
                <button onClick={download} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 font-bold text-white">
                  <Download size={17} /> Tải file TXT
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="Tên" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
                <Field label="Email backup" value={form.backupEmail} onChange={(backupEmail) => setForm((current) => ({ ...current, backupEmail }))} />
                <label className="block text-sm font-bold">
                  Tài khoản
                  <div className="mt-2 flex min-h-11 items-center rounded-md border px-3">
                    <span className="text-zinc-500">tlora.</span>
                    <input value={form.account} onChange={(event) => setForm((current) => ({ ...current, account: event.target.value }))} className="min-w-0 flex-1 outline-none" />
                  </div>
                </label>
                {message && <p className="text-sm text-red-600">{message}</p>}
                <button disabled={!form.name || !form.account || creating} onClick={create} className="min-h-11 w-full rounded-md bg-[#d8b766] font-bold disabled:opacity-40">
                  {creating ? "Đang tạo..." : "Tạo tài khoản và mật khẩu"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border px-3 font-normal" /></label>;
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-zinc-500">{label}</p>
      <div className="mt-1 flex items-center rounded-md border bg-zinc-50 px-3">
        <code className="flex-1 py-3">{value}</code>
        <button aria-label={`Sao chép ${label}`} onClick={() => navigator.clipboard.writeText(value)}><Copy size={16} /></button>
      </div>
    </div>
  );
}
