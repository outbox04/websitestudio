'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('System error occurred:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#14110f] text-[#f4ece0] p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl rounded-2xl border border-red-500/30 bg-[#1c1813] p-8 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3 text-red-500 mb-6">
          <svg className="w-8 h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h2 className="text-xl font-bold text-[#f4ece0]">Đã xảy ra lỗi trong hệ thống quản trị</h2>
            <p className="text-xs text-red-400/80 mt-0.5">Vui lòng chụp lại thông tin bên dưới để được hỗ trợ</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-black/40 p-4 border border-white/5">
            <p className="text-sm font-bold text-red-400">Error Message:</p>
            <p className="mt-1 text-sm font-mono break-all">{error.message || 'Lỗi không xác định'}</p>
          </div>

          {error.stack && (
            <div className="rounded-lg bg-black/40 p-4 border border-white/5">
              <p className="text-sm font-bold text-[#c99a5e] mb-2">Stack Trace:</p>
              <pre className="text-[11px] leading-relaxed text-[#cbc0b0] whitespace-pre-wrap font-mono overflow-auto max-h-60">
                {error.stack}
              </pre>
            </div>
          )}

          {error.digest && (
            <p className="text-xs text-[#8c8174] font-mono">Digest ID: {error.digest}</p>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 min-h-11 rounded-md bg-[#c99a5e] hover:bg-[#b0834f] text-zinc-950 font-bold transition-all text-sm"
          >
            Thử tải lại trang
          </button>
          <a
            href="/"
            className="flex-1 min-h-11 flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5 font-semibold text-sm transition-all"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
