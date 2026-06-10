import { NextResponse } from "next/server";
import { createCustomerDriveFolders } from "@/lib/google-drive";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim();
}

function publicOrigin(request: Request) {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    return `${forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
}

function customerUrl(request: Request, slug: string) {
  return `${publicOrigin(request).replace(/\/$/, "")}/${slug}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const message = [record.message, record.details, record.hint, record.code]
      .filter(Boolean)
      .join(" - ");

    if (message) {
      return message;
    }

    return JSON.stringify(record);
  }

  return "Không tạo được thư mục khách hàng";
}

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customer_galleries")
      .select(
        "id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled,created_at,updated_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      galleries: (data || []).map((gallery) => ({
        ...gallery,
        customerUrl: customerUrl(request, gallery.customer_name_slug),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, shootDate } = (await request.json()) as {
    name?: string;
    shootDate?: string;
  };

  if (!name?.trim() || !shootDate) {
    return NextResponse.json({ error: "Tên và ngày chụp là bắt buộc" }, { status: 400 });
  }

  const slug = createSlug(name);

  if (!slug) {
    return NextResponse.json({ error: "Tên không hợp lệ để tạo slug" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const url = customerUrl(request, slug);

    const { data: existingGallery, error: existingError } = await supabase
      .from("customer_galleries")
      .select("*")
      .eq("customer_name_slug", slug)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingGallery) {
      return NextResponse.json({
        gallery: existingGallery,
        customerUrl: url,
        reused: true,
      });
    }

    const folders = await createCustomerDriveFolders(name.trim());

    const { data, error } = await supabase
      .from("customer_galleries")
      .insert({
        customer_name: name.trim(),
        customer_name_slug: slug,
        shoot_date: shootDate,
        root_drive_folder_id: folders.rootFolderId,
        raw_drive_folder_id: folders.rawFolderId,
        edited_drive_folder_id: folders.editedFolderId,
        root_drive_folder_url: folders.rootFolderUrl,
        raw_drive_folder_url: folders.rawFolderUrl,
        edited_drive_folder_url: folders.editedFolderUrl,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      gallery: data,
      customerUrl: url,
      reused: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
