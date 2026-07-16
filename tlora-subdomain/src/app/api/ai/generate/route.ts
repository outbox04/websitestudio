import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inspectImageBuffer } from "@/lib/image-upload";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const defaultModel = "gpt-image-1";
const maxUploadBytes = 50 * 1024 * 1024;
const aiConceptPriceVnd = 50_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để tạo ảnh concept" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const outfit = String(formData.get("outfit") || "");
  const background = String(formData.get("background") || "");
  const style = String(formData.get("style") || "");
  const conceptNote = String(formData.get("conceptNote") || "").trim();

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image file is required" }, { status: 400 });
  }

  if (!outfit || !background || !style) {
    return NextResponse.json({ error: "outfit, background and style are required" }, { status: 400 });
  }

  if (image.size > maxUploadBytes) {
    return NextResponse.json({ error: "Image must be under 50MB" }, { status: 400 });
  }
  const rateLimit = checkRateLimit(`ai-generate:${user.id}`, 3, 10 * 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Vui lòng chờ trước khi tạo thêm ảnh." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
  const buffer = Buffer.from(await image.arrayBuffer());
  const inspected = inspectImageBuffer(buffer);
  if (!inspected) {
    return NextResponse.json({ error: "Only valid JPEG, PNG and WebP images are supported" }, { status: 415 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credit_balance_vnd")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const currentBalance = profile?.credit_balance_vnd || 0;
  if (currentBalance < aiConceptPriceVnd) {
    return NextResponse.json({ error: "Số dư chưa đủ để tạo ảnh. Mỗi ảnh concept có giá 50.000đ." }, { status: 402 });
  }

  const prompt = [
    "Create a premium studio portrait concept from the uploaded face reference.",
    "Preserve facial identity, natural skin texture, and realistic proportions.",
    `Outfit: ${outfit}.`,
    `Background: ${background}.`,
    `Style: ${style}.`,
    conceptNote ? `Client note: ${conceptNote}.` : "",
    "Use soft professional studio lighting, clean composition, no text, no watermark, no logos.",
  ].filter(Boolean).join(" ");

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await toFile(buffer, image.name || "face-reference.png", {
      type: inspected.mime,
    });

    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || defaultModel,
      image: file,
      prompt,
      size: "1024x1536",
      quality: "high",
    });

    const generated = result.data?.[0]?.b64_json;

    if (!generated) {
      return NextResponse.json({ error: "OpenAI did not return an image" }, { status: 502 });
    }

    const nextBalance = currentBalance - aiConceptPriceVnd;
    const { data: updatedProfile, error: balanceError } = await admin
      .from("profiles")
      .update({ credit_balance_vnd: nextBalance })
      .eq("id", user.id)
      .select("credit_balance_vnd")
      .single();

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    await admin.from("wallet_transactions").insert({
      user_id: user.id,
      amount_vnd: -aiConceptPriceVnd,
      type: "ai_concept_charge",
      note: `${style} · ${outfit} · ${background}`,
    });

    await admin.from("ai_requests").insert({
      user_id: user.id,
      outfit_preset: outfit,
      background_preset: background,
      style_preset: style,
      prompt,
      status: "completed",
    });

    return NextResponse.json({
      status: "completed",
      model: process.env.OPENAI_IMAGE_MODEL || defaultModel,
      prompt,
      imageBase64: generated,
      balanceVnd: updatedProfile.credit_balance_vnd,
      usage: result.usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OpenAI image generation failed" },
      { status: 500 },
    );
  }
}
