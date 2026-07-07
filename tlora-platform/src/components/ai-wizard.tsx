"use client";

import Image from "next/image";
import { Check, ImageUp, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { aiPresets } from "@/lib/site-data";
import { StateBox } from "@/components/ui";

const steps = ["Upload ảnh rõ mặt", "Chọn trang phục", "Chọn background", "Xem lại yêu cầu", "Tạo ảnh"];

type GenerateResponse = {
  status?: string;
  imageBase64?: string;
  error?: string;
};

export function AiWizard() {
  const [step, setStep] = useState(0);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [outfit, setOutfit] = useState(aiPresets.outfits[0]);
  const [background, setBackground] = useState(aiPresets.backgrounds[0]);
  const [style, setStyle] = useState(aiPresets.styles[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [resultImage, setResultImage] = useState("");

  async function generate() {
    if (!sourceImage) {
      setError("Vui lòng upload ảnh rõ mặt trước khi tạo ảnh.");
      setStep(0);
      return;
    }

    setLoading(true);
    setError("");
    setDone(false);
    setResultImage("");

    const body = new FormData();
    body.set("image", sourceImage);
    body.set("outfit", outfit);
    body.set("background", background);
    body.set("style", style);

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
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tạo được ảnh AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="space-y-2">
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${
                step === index ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <span className="grid size-7 place-items-center rounded-full bg-white/15 ring-1 ring-current/15">{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </aside>
      <section className="min-h-[520px] rounded-md border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
        {error && <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        {step === 0 && (
          <div className="grid min-h-[420px] place-items-center rounded-md border border-dashed border-zinc-300 bg-stone-50 p-6 text-center">
            <div>
              <ImageUp className="mx-auto text-zinc-500" size={42} />
              <h2 className="mt-4 text-2xl font-bold">Upload ảnh rõ mặt</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">Ảnh chính diện, đủ sáng, không che mặt để workflow AI giữ nhận diện tốt hơn.</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setSourceImage(event.target.files?.[0] || null)}
                className="mt-6 block w-full max-w-sm rounded-md border border-zinc-200 p-3 text-sm"
              />
              {sourceImage && <p className="mt-3 text-sm font-semibold text-emerald-700">Đã chọn: {sourceImage.name}</p>}
            </div>
          </div>
        )}
        {step === 1 && <PresetPicker title="Trang phục" options={aiPresets.outfits} value={outfit} onChange={setOutfit} />}
        {step === 2 && <PresetPicker title="Background" options={aiPresets.backgrounds} value={background} onChange={setBackground} />}
        {step === 3 && (
          <div className="space-y-5">
            <PresetPicker title="Phong cách ảnh" options={aiPresets.styles} value={style} onChange={setStyle} compact />
            <StateBox title="Tóm tắt yêu cầu" description={`${outfit} · ${background} · ${style}. Dữ liệu sẽ được gửi vào OpenAI Images API và có thể lưu lịch sử Supabase.`} />
          </div>
        )}
        {step === 4 && (
          <div className="grid min-h-[420px] place-items-center text-center">
            <div className="w-full max-w-2xl">
              {done ? <Check className="mx-auto text-emerald-600" size={48} /> : <Sparkles className="mx-auto text-rose-600" size={48} />}
              <h2 className="mt-4 text-2xl font-bold">{done ? "Ảnh AI đã tạo xong" : "Sẵn sàng tạo ảnh AI bằng OpenAI"}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">
                API route `/api/ai/generate` nhận ảnh, preset và gọi OpenAI Images API bằng `OPENAI_API_KEY`.
              </p>
              <button
                onClick={generate}
                disabled={loading}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Tạo ảnh
              </button>
              {resultImage && (
                <div className="relative mx-auto mt-6 aspect-[2/3] w-full max-w-sm overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                  <Image src={resultImage} alt="Ảnh AI đã tạo" fill sizes="384px" className="object-cover" unoptimized />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button onClick={() => setStep(Math.max(0, step - 1))} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold">
            Quay lại
          </button>
          <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
            Tiếp tục
          </button>
        </div>
      </section>
    </div>
  );
}

function PresetPicker({
  title,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Chọn {title.toLowerCase()}</h2>
      <div className={`mt-5 grid gap-4 ${compact ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-24 rounded-md border p-4 text-left font-semibold transition ${
              value === option ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-stone-50 text-zinc-800 hover:bg-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
