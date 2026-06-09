import { NextResponse } from "next/server";
import { createCustomerDriveFolders } from "@/lib/google-drive";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const customerUrl = `${siteUrl.replace(/\/$/, "")}/${slug}`;

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
        customerUrl,
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
      customerUrl,
      reused: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
