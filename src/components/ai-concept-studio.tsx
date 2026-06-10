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

const conceptExamples = [
  {
    title: "Profile doanh nhân",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Beauty portrait",
    image: "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Editorial mood",
    image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=700&q=82",
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
    <div className="mx-auto max-w-7xl">
      <Hero user={user} />

      {!user ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <ConceptPreview />
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
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/25">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Công cụ thử concept</p>
                <h2 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">Tạo bản nháp ý tưởng trước buổi chụp</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Mỗi ảnh AI giá 50.000đ. Kết quả dùng để chọn mood, không thay thế ảnh studio thật.
                </p>
              </div>
              <button onClick={signOut} className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10">
                Đăng xuất
              </button>
            </div>

            {appError && <div className="mt-5 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-sm font-medium text-red-100">{appError}</div>}

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <UploadPanel sourceImage={sourceImage} setSourceImage={setSourceImage} />

              <div className="space-y-5">
                <PresetPicker title="Trang phục" options={aiPresets.outfits} value={outfit} onChange={setOutfit} />
                <PresetPicker title="Bối cảnh" options={aiPresets.backgrounds} value={background} onChange={setBackground} />
                <PresetPicker title="Phong cách" options={aiPresets.styles} value={style} onChange={setStyle} />
                <label className="block text-sm font-semibold text-zinc-200">
                  Ghi chú concept cho ekip studio
                  <textarea
                    value={conceptNote}
                    onChange={(event) => setConceptNote(event.target.value)}
                    className="mt-2 min-h-24 w-full resize-none rounded-md border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#d8b766]"
                    placeholder="Ví dụ: sang trọng, doanh nhân, giữ tóc tự nhiên, ánh sáng mềm..."
                  />
                </label>
                <button
                  onClick={generateImage}
                  disabled={generateLoading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-black transition hover:bg-[#f0d58c] disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
                >
                  {generateLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  Tạo ảnh tham khảo - 50.000đ
                </button>
              </div>
            </div>

            {resultImage && (
              <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">Bản concept tham khảo</h2>
                    <p className="mt-1 text-sm text-zinc-400">Bạn có thể dùng ảnh này làm moodboard khi đặt lịch chụp tại TLORA.</p>
                  </div>
                  <Link href="/bang-gia" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15">
                    Chụp bản studio <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="relative mt-4 aspect-[2/3] w-full max-w-sm overflow-hidden rounded-md border border-white/10 bg-black">
                  <Image src={resultImage} alt="Ảnh concept AI tham khảo" fill sizes="384px" className="object-cover" unoptimized />
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <WalletPanel
              userEmail={user.email}
              balanceVnd={balanceVnd}
              remainingTurns={remainingTurns}
              topUpAmount={topUpAmount}
              setTopUpAmount={setTopUpAmount}
              topUpLoading={topUpLoading}
              onTopUp={topUp}
            />
            <HistoryPanel history={history} />
          </aside>
        </div>
      )}

      <StudioBridge />
    </div>
  );
}

function Hero({ user }: { user: UserSummary | null }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} priority className="h-auto w-full max-w-xs object-contain" />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">AI Concept by TLORA Studio</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Thử mood ảnh trước, chụp bản chất lượng cao tại studio sau.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            AI Concept giúp bạn tham khảo trang phục, bối cảnh và thần thái với chi phí 50.000đ/ảnh. Khi đã chọn được hướng đẹp, TLORA sẽ biến ý tưởng đó thành bộ ảnh thật với ánh sáng, ekip và file chất lượng cao.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={user ? "#tool" : "#dang-ky"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-black hover:bg-[#f0d58c]">
              Thử concept 50k <Sparkles size={16} />
            </Link>
            <Link href="/bang-gia" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-white hover:bg-white/10">
              Xem gói chụp studio <Camera size={16} />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {conceptExamples.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-lg border border-white/10 bg-black/25">
              <div className="relative aspect-[4/5]">
                <Image src={item.image} alt={item.title} fill sizes="(min-width: 1280px) 180px, 33vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <h3 className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConceptPreview() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101115] p-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Thử ý tưởng", "Upload ảnh rõ mặt, chọn trang phục, bối cảnh và phong cách."],
          ["2", "Chọn mood phù hợp", "Lưu lại hướng ảnh bạn thích để làm brief trước buổi chụp."],
          ["3", "Đặt lịch studio", "Ekip TLORA dựng lại concept với ánh sáng và chất lượng file chuyên nghiệp."],
        ].map(([step, title, description]) => (
          <div key={step} className="rounded-md border border-white/10 bg-black/25 p-4">
            <span className="grid size-9 place-items-center rounded-full bg-[#d8b766] text-sm font-extrabold text-black">{step}</span>
            <h3 className="mt-4 font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UploadPanel({
  sourceImage,
  setSourceImage,
}: {
  sourceImage: File | null;
  setSourceImage: (file: File | null) => void;
}) {
  return (
    <div id="tool" className="rounded-lg border border-dashed border-white/15 bg-black/25 p-5">
      <div className="grid min-h-80 place-items-center text-center">
        <div>
          <ImageUp className="mx-auto text-[#d8b766]" size={44} />
          <h2 className="mt-4 text-xl font-bold text-white">Ảnh gốc rõ mặt</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Nên dùng ảnh chính diện, đủ sáng, không che mặt để bản tham khảo giữ nhận diện tốt hơn.</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setSourceImage(event.target.files?.[0] || null)}
            className="mt-5 w-full rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-[#d8b766] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
          {sourceImage && <p className="mt-3 text-sm font-semibold text-emerald-300">{sourceImage.name}</p>}
        </div>
      </div>
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
    <form id="dang-ky" onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white p-6 text-zinc-950 shadow-2xl shadow-black/30">
      <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1">
        <button type="button" onClick={() => setMode("register")} className={`min-h-10 rounded-md text-sm font-bold ${mode === "register" ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>
          Đăng ký
        </button>
        <button type="button" onClick={() => setMode("login")} className={`min-h-10 rounded-md text-sm font-bold ${mode === "login" ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>
          Đăng nhập
        </button>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-zinc-950 text-white">
          {mode === "register" ? <UserPlus size={20} /> : <LogIn size={20} />}
        </span>
        <div>
          <h2 className="text-2xl font-extrabold">{mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}</h2>
          <p className="mt-1 text-sm text-zinc-600">Quản lý ví, lịch sử concept và brief trước khi đặt lịch chụp.</p>
        </div>
      </div>
      {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      {mode === "register" && (
        <label className="mt-5 block text-sm font-semibold">
          Họ tên
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="Nguyễn Minh Anh" />
        </label>
      )}
      <label className="mt-5 block text-sm font-semibold">
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="you@example.com" />
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Mật khẩu
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-950" placeholder="Tối thiểu 6 ký tự" />
      </label>
      <button disabled={loading} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:bg-zinc-400">
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
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-400">{userEmail}</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">{formatMoney(balanceVnd)}</h2>
        </div>
        <span className="grid size-12 place-items-center rounded-full bg-[#d8b766]/15 text-[#f3d88e]">
          <Wallet size={23} />
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-400">Có thể tạo thêm {remainingTurns} ảnh tham khảo.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
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

function HistoryPanel({ history }: { history: HistoryItem[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-lg font-bold text-white">Moodboard gần đây</h2>
      <div className="mt-4 space-y-3">
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
    <section className="mt-10 rounded-lg border border-white/10 bg-[#101115] p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Từ AI đến ảnh thật</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-4xl">
            AI là bản phác thảo. Studio mới là nơi tạo ra file ảnh chuẩn để dùng lâu dài.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Khi bạn đã có mood ảnh phù hợp, TLORA dùng nó làm brief để setup ánh sáng, trang phục, makeup và hướng tạo dáng thật.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/bang-gia" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-black hover:bg-[#f0d58c]">
              Đặt lịch chụp studio <ArrowRight size={16} />
            </Link>
            <Link href="/dich-vu" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/15">
              Xem dịch vụ TLORA
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          {studioUpsell.map((item) => (
            <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-4">
              <Check className="mt-0.5 shrink-0 text-[#d8b766]" size={18} />
              <p className="text-sm leading-6 text-zinc-300">{item}</p>
            </div>
          ))}
        </div>
      </div>
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
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-12 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
              value === option ? "border-[#d8b766] bg-[#d8b766] text-black" : "border-white/10 bg-black/25 text-zinc-200 hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
