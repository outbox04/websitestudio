import { json, options } from "@/lib/tlora-api";

export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json({
    ok: true,
    service: "tlora-api",
    time: new Date().toISOString(),
  });
}
