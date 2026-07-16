import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/tenancy/request-context";

export function tloraApiError(error: unknown) {
  if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: "Dữ liệu không hợp lệ.", issues: error.issues }, { status: 422 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "TLORA CMS request failed" }, { status: 500 });
}

