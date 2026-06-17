"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Coins,
  Heart,
  ImageUp,
  Loader2,
  LogIn,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import { aiPresets } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/browser";

const imagePriceVnd = 50_000;
const topUpOptions = [50_000, 100_000, 200_000, 500_000];

type UserSummary = {
  id: string;
  email: string;
};

type HistoryItem = {
  id: string;
  outfit_preset: string;
  background_preset: string;
  style_preset: string;
  status: string;
  result_image_url: string | null;
  created_at: string;
};

type GenerateResponse = {
  imageBase64?: string;
  balanceVnd?: number;
  error?: string;
};

const toolCategories = [
  "Ảnh cưới",
  "Chân dung cá nhân",
  "Profile doanh nhân",
  "Ảnh gia đình",
  "Lookbook thương hiệu",
  "Beauty portrait",
  "Korean profile",
  "Luxury magazine",
  "Ảnh kỷ niệm",
  "Make up & tóc",
];

const readyConcepts = [
  {
    title: "Wedding white",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=82",
  },
  {
    title: "Clean beauty",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=82",
  },
  {
    title: "Business",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=82",
  },
  {
    title: "Editorial",
    image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=500&q=82",
  },
];

const studioUpsell = [
  "AI giúp bạn nhìn nhanh mood ảnh, trang phục và background trước khi đặt lịch.",
  "Buổi chụp thật tại TLORA cho ánh sáng, biểu cảm, dáng người và chất lượng file tốt hơn.",
  "Ekip studio sẽ dùng concept bạn thích làm brief để setup set chụp chính xác hơn.",
];

export function AiConceptStudio({
  user,
  initialBalanceVnd,
  initialFullName,
  initialHistory,
}: {
  user: UserSummary | null;
  initialBalanceVnd: number;
  initialFullName: string;
  initialHistory: HistoryItem[];
}) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [balanceVnd, setBalanceVnd] = useState(initialBalanceVnd);
  const [topUpAmount, setTopUpAmount] = useState(topUpOptions[1]);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [outfit, setOutfit] = useState(aiPresets.outfits[0]);
  const [background, setBackground] = useState(aiPresets.backgrounds[0]);
  const [style, setStyle] = useState(aiPresets.styles[0]);
  const [conceptNote, setConceptNote] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [resultImage, setResultImage] = useState("");
  const [appError, setAppError] = useState("");
  const [history, setHistory] = useState(initialHistory);

  const remainingTurns = useMemo(() => Math.floor(balanceVnd / imagePriceVnd), [balanceVnd]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const response = authMode === "register"
      ? await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: "customer",
            },
          },
        })
      : await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

    setAuthLoading(false);

    if (response.error) {
      setAuthError(response.error.message);
      return;
    }

    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  async function topUp() {
    setTopUpLoading(true);
    setAppError("");

    try {
      const response = await fetch("/api/account/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountVnd: topUpAmount }),
      });
      const data = (await response.json()) as { balanceVnd?: number; error?: string };

      if (!response.ok || typeof data.balanceVnd !== "number") {
        throw new Error(data.error || "Không nạp được tiền.");
      }

      setBalanceVnd(data.balanceVnd);
    } catch (caught) {
      setAppError(caught instanceof Error ? caught.message : "Không nạp được tiền.");
    } finally {
      setTopUpLoading(false);
    }
  }

  async function generateImage() {
    if (!user) {
      setAppError("Vui lòng đăng nhập để tạo ảnh concept.");
      return;
    }

    if (!sourceImage) {
      setAppError("Vui lòng upload ảnh gốc rõ mặt trước khi tạo concept.");
      return;
    }

    if (balanceVnd < imagePriceVnd) {
      setAppError("Số dư chưa đủ. Mỗi ảnh concept có giá 50.000đ.");
      return;
    }

    setGenerateLoading(true);
    setAppError("");
    setResultImage("");

    const body = new FormData();
    body.set("image", sourceImage);
    body.set("outfit", outfit);
    body.set("background", background);
    body.set("style", style);
    body.set("conceptNote", conceptNote);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok || !data.imageBase64) {
        throw new Error(data.error || "Không tạo được ảnh AI.");
      }

      setResultImage(`data:image/png;base64,${data.imageBase64}`);
      if (typeof data.balanceVnd === "number") {
        setBalanceVnd(data.balanceVnd);
      }
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          outfit_preset: outfit,
          background_preset: background,
          style_preset: style,
          status: "completed",
          result_image_url: null,
          created_at: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 8));
    } catch (caught) {
      setAppError(caught instanceof Error ? caught.message : "Không tạo được ảnh AI.");
    } finally {
      setGenerateLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-white">
      <div className="grid min-h-screen border-t border-white/10 lg:grid-cols-[256px_minmax(0,1fr)_352px]">
        <ConceptSidebar />

        <section className="min-h-screen bg-[#080d1b] px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex h-full max-w-5xl flex-col">
            <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8b766]">AI Concept Studio</p>
                <h1 className="mt-2 font-heading text-3xl font-extrabold text-white md:text-4xl">Tạo mood ảnh trước buổi chụp</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill>50.000đ / ảnh</StatusPill>
                <StatusPill>{user ? `${remainingTurns} lượt còn lại` : "Đăng nhập để tạo ảnh"}</StatusPill>
              </div>
            </div>

            {appError && <div className="mb-4 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-sm font-medium text-red-100">{appError}</div>}

            <UploadWorkspace sourceImage={sourceImage} setSourceImage={setSourceImage} resultImage={resultImage} />

            {!user && (
              <div className="mt-5 rounded-lg border border-[#d8b766]/25 bg-[#d8b766]/10 p-4 text-sm leading-6 text-[#f3d88e]">
                Đăng ký hoặc đăng nhập ở panel bên phải để lưu moodboard, nạp credit và tạo ảnh concept.
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-screen border-l border-white/10 bg-[#101827]">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-white">Yêu cầu concept</h2>
                {user && (
                  <button onClick={signOut} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10">
                    Đăng xuất
                  </button>
                )}
              </div>
              <textarea
                value={conceptNote}
                onChange={(event) => setConceptNote(event.target.value)}
                className="mt-4 min-h-28 w-full resize-none rounded-md border border-white/10 bg-[#202b3d] p-3 text-sm text-white outline-none placeholder:text-zinc-400 focus:border-[#d8b766]"
                placeholder="Nhập yêu cầu concept: thần thái, màu ảnh, tóc, trang phục, bối cảnh..."
              />
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {!user ? (
                <AuthPanel
                  mode={authMode}
                  setMode={setAuthMode}
                  fullName={fullName}
                  setFullName={setFullName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  loading={authLoading}
                  error={authError}
                  onSubmit={handleAuth}
                />
              ) : (
                <WalletPanel
                  userEmail={user.email}
                  balanceVnd={balanceVnd}
                  remainingTurns={remainingTurns}
                  topUpAmount={topUpAmount}
                  setTopUpAmount={setTopUpAmount}
                  topUpLoading={topUpLoading}
                  onTopUp={topUp}
                />
              )}

              <PresetPicker title="Trang phục" options={aiPresets.outfits} value={outfit} onChange={setOutfit} />
              <PresetPicker title="Bối cảnh" options={aiPresets.backgrounds} value={background} onChange={setBackground} />
              <PresetPicker title="Phong cách" options={aiPresets.styles} value={style} onChange={setStyle} />
              <ReadyConcepts />
              {user && <HistoryPanel history={history} />}
              <StudioBridge />
            </div>

            <div className="border-t border-white/10 bg-[#121d2d] p-4">
              <button
                onClick={generateImage}
                disabled={generateLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-extrabold text-black transition hover:bg-[#f0d58c] disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
              >
                {generateLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Tạo ảnh concept
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConceptSidebar() {
  return (
    <aside className="hidden min-h-screen border-r border-white/10 bg-[#111827] lg:block">
      <div className="sticky top-0 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-[#d8b766]/15 text-[#f3d88e]">
            <Sparkles size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b766]">TLORA AI</p>
            <h2 className="font-bold text-white">Concept</h2>
          </div>
        </div>

        <nav className="mt-7 space-y-2">
          {toolCategories.map((item, index) => (
            <button
              key={item}
              className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                index === 0 ? "bg-[#d8b766] text-black" : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-md ${index === 0 ? "bg-white/25" : "bg-white/10"}`}>
                {index === 0 ? <Heart size={16} /> : <Camera size={16} />}
              </span>
              {item}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full border border-white/10 bg-white/6 px-4 text-sm font-semibold text-zinc-200">
      {children}
    </span>
  );
}

function UploadWorkspace({
  sourceImage,
  setSourceImage,
  resultImage,
}: {
  sourceImage: File | null;
  setSourceImage: (file: File | null) => void;
  resultImage: string;
}) {
  return (
    <div className="grid flex-1 place-items-center">
      <label className="group relative flex min-h-150 w-full max-w-3xl cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-500/80 bg-[#0f1728] p-8 text-center transition hover:border-[#d8b766] hover:bg-[#121d31]">
        {resultImage ? (
          <Image src={resultImage} alt="Ảnh concept AI tham khảo" fill sizes="(min-width: 1024px) 760px, 100vw" className="object-contain p-4" unoptimized />
        ) : (
          <>
            <span className="grid size-16 place-items-center rounded-md bg-white/10 text-slate-300 transition group-hover:text-[#d8b766]">
              <ImageUp size={34} />
            </span>
            <h2 className="mt-5 text-lg font-extrabold text-white">Kéo thả hoặc nhấp để tải ảnh rõ mặt</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Dùng ảnh chính diện, đủ sáng, không che mặt. AI sẽ dùng ảnh này làm tham chiếu để tạo concept studio.
            </p>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#d8b766] px-5 text-sm font-extrabold text-black">
              Chọn ảnh
            </span>
            {sourceImage && <p className="mt-4 text-sm font-semibold text-emerald-300">{sourceImage.name}</p>}
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setSourceImage(event.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>
    </div>
  );
}

function AuthPanel({
  mode,
  setMode,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}: {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id="dang-ky" onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white p-4 text-zinc-950 shadow-2xl shadow-black/30">
      <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1">
        <button type="button" onClick={() => setMode("register")} className={`min-h-10 rounded-md text-sm font-bold ${mode === "register" ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>
          Đăng ký
        </button>
        <button type="button" onClick={() => setMode("login")} className={`min-h-10 rounded-md text-sm font-bold ${mode === "login" ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>
          Đăng nhập
        </button>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-white">
          {mode === "register" ? <UserPlus size={18} /> : <LogIn size={18} />}
        </span>
        <div>
          <h2 className="text-xl font-extrabold">{mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}</h2>
          <p className="mt-1 text-sm text-zinc-600">Lưu concept, ví và lịch sử tạo ảnh.</p>
        </div>
      </div>
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      {mode === "register" && (
        <label className="mt-4 block text-sm font-semibold">
          Họ tên
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="Nguyễn Minh Anh" />
        </label>
      )}
      <label className="mt-4 block text-sm font-semibold">
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="you@example.com" />
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Mật khẩu
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="Tối thiểu 6 ký tự" />
      </label>
      <button disabled={loading} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:bg-zinc-400">
        {loading && <Loader2 className="animate-spin" size={16} />}
        {mode === "register" ? "Đăng ký tài khoản" : "Đăng nhập"}
      </button>
    </form>
  );
}

function WalletPanel({
  userEmail,
  balanceVnd,
  remainingTurns,
  topUpAmount,
  setTopUpAmount,
  topUpLoading,
  onTopUp,
}: {
  userEmail: string;
  balanceVnd: number;
  remainingTurns: number;
  topUpAmount: number;
  setTopUpAmount: (amount: number) => void;
  topUpLoading: boolean;
  onTopUp: () => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-400">{userEmail}</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">{formatMoney(balanceVnd)}</h2>
        </div>
        <span className="grid size-11 place-items-center rounded-md bg-[#d8b766]/15 text-[#f3d88e]">
          <Wallet size={22} />
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-400">Có thể tạo thêm {remainingTurns} ảnh tham khảo.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {topUpOptions.map((amount) => (
          <button
            key={amount}
            onClick={() => setTopUpAmount(amount)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              topUpAmount === amount ? "border-[#d8b766] bg-[#d8b766] text-black" : "border-white/10 bg-black/20 text-zinc-200"
            }`}
          >
            {formatMoney(amount)}
          </button>
        ))}
      </div>
      <button onClick={onTopUp} disabled={topUpLoading} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15">
        {topUpLoading ? <Loader2 className="animate-spin" size={16} /> : <Coins size={16} />}
        Nạp tiền demo
      </button>
    </section>
  );
}

function PresetPicker({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-zinc-200">{title}</p>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
              value === option ? "border-[#d8b766] bg-[#d8b766] text-black" : "border-white/10 bg-[#202b3d] text-zinc-200 hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadyConcepts() {
  return (
    <section>
      <h2 className="text-sm font-bold text-white">Chọn có sẵn</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {readyConcepts.map((item) => (
          <article key={item.title} className="overflow-hidden rounded-md border border-white/10 bg-black/20">
            <div className="relative aspect-4/5">
              <Image src={item.image} alt={item.title} fill sizes="160px" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-xs font-bold text-white">{item.title}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HistoryPanel({ history }: { history: HistoryItem[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/4 p-4">
      <h2 className="text-sm font-bold text-white">Moodboard gần đây</h2>
      <div className="mt-3 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-400">Chưa có concept tham khảo nào được tạo.</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="text-sm font-semibold text-white">{item.style_preset}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{item.outfit_preset} · {item.background_preset}</p>
              <p className="mt-2 text-xs font-medium text-[#d8b766]">{new Date(item.created_at).toLocaleString("vi-VN")}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function StudioBridge() {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d8b766]">Từ AI đến ảnh thật</p>
      <div className="mt-3 space-y-3">
        {studioUpsell.map((item) => (
          <div key={item} className="flex gap-3">
            <Check className="mt-0.5 shrink-0 text-[#d8b766]" size={16} />
            <p className="text-sm leading-6 text-zinc-300">{item}</p>
          </div>
        ))}
      </div>
      <Link href="/bang-gia" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">
        Đặt lịch chụp studio <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
