"use client";

import { Cloud, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function StudioDriveConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/google-drive/status", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() as { connected?: boolean } }))
      .then(({ response, data }) => { if (response.ok) setConnected(Boolean(data.connected)); else setError("Không thể kiểm tra kết nối Google Drive."); })
      .catch(() => setError("Không thể kiểm tra kết nối Google Drive."));
  }, []);

  async function connect() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/google-drive/connect", { method: "POST" });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Không thể bắt đầu kết nối Google Drive.");
      window.location.assign(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể bắt đầu kết nối Google Drive.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold text-zinc-950"><Cloud size={19} className="text-[#c99a5e]" />Google Drive của studio</div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">Kết nối Drive để hệ thống tự tạo thư mục theo tên studio và lưu mỗi album vào Drive của bạn.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${connected ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{connected ? "Đã kết nối" : "Chưa kết nối"}</span>
      </div>
      {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}
      <button onClick={connect} disabled={loading || connected === null} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white disabled:bg-zinc-400">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
        {connected ? "Kết nối lại Google Drive" : "Kết nối Google Drive"}
      </button>
    </section>
  );
}
