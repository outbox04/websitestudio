"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppWindow, CheckCircle2, Download, ExternalLink, LogIn } from "lucide-react";

type ReceiptData = { studio: string; plan: string; total: number; domain: string; username: string; email: string; phone: string };

export function PaymentReceipt({ orderId }: { orderId: string }) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("tlora-registration-receipt");
    if (!stored) return;
    const timeout = window.setTimeout(() => setReceipt(JSON.parse(stored) as ReceiptData), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  const info = receipt || { studio: "Studio của bạn", plan: "TLORA Platform", total: 0, domain: "Đang khởi tạo", username: "Đang khởi tạo", email: "", phone: "" };
  function download() {
    const text = `TLORA STUDIO PLATFORM\nHÓA ĐƠN THANH TOÁN\n\nMã đơn: ${orderId}\nTrạng thái: Đã tiếp nhận thanh toán\n\nStudio: ${info.studio}\nGói: ${info.plan}\nTổng thanh toán: ${new Intl.NumberFormat("vi-VN").format(info.total)}đ\nTên miền: ${info.domain}\nTên đăng nhập: ${info.username}\nEmail: ${info.email}\nSố điện thoại: ${info.phone}\n\nTLORA sẽ kích hoạt không gian Studio của bạn ngay sau khi giao dịch được xác minh.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `hoa-don-${orderId}.txt`; link.click(); URL.revokeObjectURL(url);
  }
  const appDownloadUrl = process.env.NEXT_PUBLIC_RAW_SELECTOR_DOWNLOAD_URL || "/tai-app";
  return <main className="min-h-screen bg-[#0f172a] px-4 py-14 text-slate-100 sm:px-6"><div className="mx-auto max-w-2xl"><div className="rounded-[28px] border border-white/15 bg-slate-950/65 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-10"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#7ec624]/15 text-[#9ddd48]"><CheckCircle2 size={31} /></div><p className="mt-5 text-center text-xs font-extrabold uppercase tracking-[.16em] text-[#9ddd48]">Đã nhận thanh toán</p><h1 className="mt-3 text-center font-heading text-3xl font-extrabold text-white">Thông tin Studio của bạn</h1><p className="mt-3 text-center text-sm leading-6 text-slate-400">Mã đơn: <b className="text-slate-200">{orderId}</b></p><div className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.035] px-5">{[["Tên Studio", info.studio], ["Gói đã chọn", info.plan], ["Tên miền", info.domain], ["Tên đăng nhập", info.username], ["Tổng thanh toán", info.total ? new Intl.NumberFormat("vi-VN").format(info.total) + "đ" : "Đang xác minh"]].map(([label, value]) => <div key={label as string} className="flex items-center justify-between gap-5 py-4 text-sm"><span className="text-slate-400">{label}</span><b className="text-right text-slate-100">{value}</b></div>)}</div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={download} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#7ec624] px-5 text-sm font-extrabold text-[#0f172a]"><Download size={17} />Tải hoá đơn .txt</button><a href={appDownloadUrl} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white"><AppWindow size={17} />Tải app quản lý</a><Link href="/dang-nhap" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#7ec624]/50 bg-[#7ec624]/10 text-sm font-extrabold text-[#b8ed77] sm:col-span-2"><LogIn size={17} />Đăng nhập vào trang quản trị</Link></div><p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500"><ExternalLink size={13} />Website & license sẽ được kích hoạt sau khi SePay xác minh IPN.</p></div></div></main>;
}
