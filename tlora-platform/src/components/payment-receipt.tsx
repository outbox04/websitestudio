"use client";

import { useEffect, useState } from "react";
import { AppWindow, CheckCircle2, Download, ExternalLink, LogIn, Monitor } from "lucide-react";

type ReceiptData = { studio: string; representative?: string; plan: string; total: number; industry?: string; domain: string; username: string; email: string; phone: string; address?: string };
const money = (value: number) => value ? new Intl.NumberFormat("vi-VN").format(value) + "đ" : "Đang xác minh";

export function PaymentReceipt({ orderId }: { orderId: string }) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("tlora-registration-receipt");
      if (stored) setReceipt(JSON.parse(stored) as ReceiptData);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const info = receipt || { studio: "Studio của bạn", plan: "TLORA Platform", total: 0, domain: "Đang khởi tạo", username: "Đang khởi tạo", email: "", phone: "", address: "" };
  const websiteUrl = info.domain.includes(".") ? `https://${info.domain}` : "";
  const adminUrl = websiteUrl ? `${websiteUrl}/quan-tri` : "/dang-nhap";
  const industry = info.industry === "wedding" ? "Studio cưới / Wedding" : info.industry === "concept" ? "Studio concept / Concept" : "Chưa chọn";
  function downloadWebsiteInfo() {
    const text = `TLORA STUDIO PLATFORM\nTHÔNG TIN WEBSITE & TÀI KHOẢN\n\nMã đơn: ${orderId}\nTrạng thái: Đã tiếp nhận thanh toán\n\nTHÔNG TIN STUDIO\nTên Studio: ${info.studio}\nNgười đại diện: ${info.representative || "-"}\nLĩnh vực/Giao diện: ${industry}\nGói: ${info.plan}\nEmail: ${info.email || "-"}\nSố điện thoại: ${info.phone || "-"}\nĐịa chỉ: ${info.address || "-"}\n\nWEBSITE & QUẢN TRỊ\nTên miền: ${info.domain}\nLink website: ${websiteUrl || "Đang khởi tạo"}\nLink trang quản trị: ${adminUrl}\nTên đăng nhập: ${info.username}\n\nTHANH TOÁN\nTổng thanh toán: ${money(info.total)}\n\nVui lòng lưu lại thông tin này. Sau khi SePay xác minh, bạn có thể đăng nhập bằng link quản trị ở trên.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `thong-tin-website-${orderId}.txt`; link.click(); URL.revokeObjectURL(url);
  }
  const rows = [["Tên Studio", info.studio], ["Người đại diện", info.representative || "-"], ["Giao diện", industry], ["Gói đã chọn", info.plan], ["Email", info.email || "-"], ["Số điện thoại", info.phone || "-"], ["Địa chỉ", info.address || "-"], ["Tên miền", info.domain], ["Tên đăng nhập", info.username], ["Tổng thanh toán", money(info.total)]];
  const appDownloadUrl = process.env.NEXT_PUBLIC_RAW_SELECTOR_DOWNLOAD_URL || "/tai-app";
  return <main className="min-h-screen bg-[#0f172a] px-4 py-14 text-slate-100 sm:px-6"><div className="mx-auto max-w-3xl"><div className="rounded-[28px] border border-white/15 bg-slate-950/65 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-10"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#7ec624]/15 text-[#9ddd48]"><CheckCircle2 size={31}/></div><p className="mt-5 text-center text-xs font-extrabold uppercase tracking-[.16em] text-[#9ddd48]">Đã nhận thanh toán</p><h1 className="mt-3 text-center font-heading text-3xl font-extrabold text-white">Thông tin website Studio</h1><p className="mt-3 text-center text-sm leading-6 text-slate-400">Mã đơn: <b className="text-slate-200">{orderId}</b></p><div className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.035] px-5">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 py-3 text-sm"><span className="text-slate-400">{label}</span><b className="max-w-[62%] text-right text-slate-100">{value}</b></div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><a href={websiteUrl || undefined} target="_blank" rel="noreferrer" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${websiteUrl ? "border-[#7ec624]/50 bg-[#7ec624]/10 text-[#b8ed77]" : "pointer-events-none border-white/10 text-slate-500"}`}><Monitor size={17}/>Mở website Studio</a><a href={adminUrl} target={websiteUrl ? "_blank" : undefined} rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#7ec624]/50 bg-[#7ec624]/10 text-sm font-extrabold text-[#b8ed77]"><LogIn size={17}/>Mở trang quản trị</a><button onClick={downloadWebsiteInfo} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#7ec624] px-5 text-sm font-extrabold text-[#0f172a]"><Download size={17}/>Tải thông tin website</button><a href={appDownloadUrl} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white"><AppWindow size={17}/>Tải app quản lý</a></div><p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500"><ExternalLink size={13}/>Cả trang này và file tải xuống đều lưu link website cùng link trang quản trị của Studio.</p></div></div></main>;
}
