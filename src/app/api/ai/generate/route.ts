import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const defaultModel = "gpt-image-1";
const maxUploadBytes = 50 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const outfit = String(formData.get("outfit") || "");
  const background = String(formData.get("background") || "");
  const style = String(formData.get("style") || "");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image file is required" }, { status: 400 });
  }

  if (!outfit || !background || !style) {
    return NextResponse.json({ error: "outfit, background and style are required" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
  }

  if (image.size > maxUploadBytes) {
    return NextResponse.json({ error: "Image must be under 50MB" }, { status: 400 });
  }

  const prompt = [
    "Create a premium studio portrait concept from the uploaded face reference.",
    "Preserve facial identity, natural skin texture, and realistic proportions.",
    `Outfit: ${outfit}.`,
    `Background: ${background}.`,
    `Style: ${style}.`,
    "Use soft professional studio lighting, clean composition, no text, no watermark, no logos.",
  ].join(" ");

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const buffer = Buffer.from(await image.arrayBuffer());
    const file = await toFile(buffer, image.name || "face-reference.png", {
      type: image.type || "image/png",
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

    return NextResponse.json({
      status: "completed",
      model: process.env.OPENAI_IMAGE_MODEL || defaultModel,
      prompt,
      imageBase64: generated,
      usage: result.usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OpenAI image generation failed" },
      { status: 500 },
    );
  }
}
