import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
    if (!context) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update studio settings
    const { error: studioUpdateError } = await supabase
      .from("studios")
      .update({
        settings: {
          setup_completed: true,
          phone: "0901234567",
          email: `contact@${context.studioSlug}.tlgroup.site`,
          address: "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh",
        },
        status: "active",
      })
      .eq("id", context.studioId);

    if (studioUpdateError) throw studioUpdateError;

    // 2. Set up mock Google Drive connection if not connected
    const { data: driveConn, error: driveConnError } = await supabase
      .from("studio_google_drive_connections")
      .select("root_folder_id")
      .eq("studio_id", context.studioId)
      .maybeSingle();

    if (driveConnError) throw driveConnError;

    if (!driveConn) {
      const { error: driveInsertError } = await supabase
        .from("studio_google_drive_connections")
        .insert({
          studio_id: context.studioId,
          google_account_email: `demo-drive@${context.studioSlug}.tlgroup.site`,
          root_folder_id: `mock-root-${context.studioSlug}`,
          refresh_token_ciphertext: "mock_iv.mock_tag.mock_encrypted",
          connected_by: context.userId,
        });
      if (driveInsertError) throw driveInsertError;
    }

    // 3. Ensure a default payment settings row is present
    const { data: paymentSettings } = await supabase
      .from("payment_settings")
      .select("id")
      .eq("id", 1)
      .maybeSingle();

    if (!paymentSettings) {
      await supabase.from("payment_settings").insert({
        id: 1,
        bank_bin: "970415",
        bank_name: "VietinBank",
        account_number: "101876543210",
        account_name: "TLORA STUDIO",
      });
    }

    // 4. Create sample post if none exists for this studio
    const { data: existingPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("studio_id", context.studioId)
      .limit(1);

    if (!existingPosts || existingPosts.length === 0) {
      await supabase.from("posts").insert({
        studio_id: context.studioId,
        title: "Xu hướng chụp ảnh profile cá nhân 2026",
        slug: "xu-huong-chup-anh-profile-ca-nhan-2026",
        excerpt: "Khám phá phong cách chân dung tối giản và ánh sáng editorial đang rất được ưa chuộng hiện nay.",
        content: `Chụp ảnh profile cá nhân nghệ thuật hiện đang dần chuyển từ phong cách phông nền màu truyền thống sang phong cách chân dung tự nhiên kết hợp ánh sáng điện ảnh (cinematic lighting). 
        
Khách hàng ngày nay tìm kiếm những bức ảnh có hồn, thể hiện được đúng tính cách, thần thái và chiều sâu của bản thân chứ không chỉ đơn thuần là ảnh thẻ phóng to.

Để có một bộ ảnh profile hoàn hảo nhất, bạn nên chuẩn bị:
1. Trang phục: Nên chọn tone màu nhã nhặn, phom dáng đứng form và hạn chế tối đa các họa tiết quá cầu kỳ, lòe loẹt.
2. Trang điểm: Makeup tự nhiên, làm nổi bật đường nét sẵn có và hạn chế đánh khối quá dày.
3. Thần thái: Thả lỏng toàn bộ cơ thể, giữ ánh mắt tự nhiên hướng về ống kính và cười nhẹ nhàng.`,
        published: true,
      });
    }

    // 5. Create sample customer galleries if none exist
    const { data: existingGalleries } = await supabase
      .from("customer_galleries")
      .select("id")
      .eq("studio_id", context.studioId)
      .limit(1);

    if (!existingGalleries || existingGalleries.length === 0) {
      // Gallery 1: Hà Vy
      const { data: gallery1, error: g1Error } = await supabase
        .from("customer_galleries")
        .insert({
          customer_name: "Hà Vy",
          customer_name_slug: "ha-vy-beauty-portrait",
          shoot_date: new Date().toISOString().split("T")[0],
          studio_id: context.studioId,
          cover_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=82",
          root_drive_folder_id: "mock-root-ha-vy",
          raw_drive_folder_id: "mock-raw-ha-vy",
          edited_drive_folder_id: "mock-edited-ha-vy",
          root_drive_folder_url: "https://drive.google.com/drive/folders/mock-root-ha-vy",
          raw_drive_folder_url: "https://drive.google.com/drive/folders/mock-raw-ha-vy",
          edited_drive_folder_url: "https://drive.google.com/drive/folders/mock-edited-ha-vy",
          raw_download_enabled: true,
          edited_download_enabled: false,
        })
        .select("id")
        .single();

      if (g1Error) throw g1Error;

      // Gallery 2: Minh Quân
      const { data: gallery2, error: g2Error } = await supabase
        .from("customer_galleries")
        .insert({
          customer_name: "Minh Quân",
          customer_name_slug: "minh-quan-concept-sinh-nhat",
          shoot_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          studio_id: context.studioId,
          cover_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=82",
          root_drive_folder_id: "mock-root-minh-quan",
          raw_drive_folder_id: "mock-raw-minh-quan",
          edited_drive_folder_id: "mock-edited-minh-quan",
          root_drive_folder_url: "https://drive.google.com/drive/folders/mock-root-minh-quan",
          raw_drive_folder_url: "https://drive.google.com/drive/folders/mock-raw-minh-quan",
          edited_drive_folder_url: "https://drive.google.com/drive/folders/mock-edited-minh-quan",
          raw_download_enabled: true,
          edited_download_enabled: true,
        })
        .select("id")
        .single();

      if (g2Error) throw g2Error;

      // Insert photos for Hà Vy (Unselected, Selected and Edited)
      const haVyPhotos = [];
      const imgIds = [
        "1524504388940-b1c1722653e1",
        "1512316609839-ce289d3eba0a",
        "1509967419530-da38b4704bc6",
        "1509631179647-0177331693ae",
        "1494790108377-be9c29b29330",
        "1534528741775-53994a69daeb"
      ];
      
      for (let i = 1; i <= 6; i++) {
        haVyPhotos.push({
          gallery_id: gallery1.id,
          drive_file_id: `mock-havy-raw-${i}`,
          file_name: `DSC_490${i}.JPG`,
          thumbnail_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=300&q=80`,
          preview_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=1200&q=85`,
          download_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=2400&q=100`,
          kind: "raw",
          selected: i <= 2,
          edit_note: i === 1 ? "Làm mịn da và làm sáng phông nền giúp em." : null,
        });
      }

      await supabase.from("customer_gallery_photos").insert(haVyPhotos);

      // Insert photos for Minh Quân (Includes both RAW and EDITED)
      const minhQuanPhotos = [];
      const imgIds2 = [
        "1519741497674-611481863552",
        "1503342217505-b0a15ec3261c",
        "1506794778202-cad84cf45f1d",
        "1500648767791-00dcc994a43e",
        "1492562080023-ab3db95bfbce",
        "1507003211169-0a1dd7228f2d"
      ];

      for (let i = 1; i <= 6; i++) {
        minhQuanPhotos.push({
          gallery_id: gallery2.id,
          drive_file_id: `mock-mq-raw-${i}`,
          file_name: `DSC_820${i}.JPG`,
          thumbnail_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=300&q=80`,
          preview_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=1200&q=85`,
          download_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=2400&q=100`,
          kind: "raw",
          selected: i <= 3,
          edit_note: null,
        });
      }

      // Add 2 edited photos matching selected
      for (let i = 1; i <= 2; i++) {
        minhQuanPhotos.push({
          gallery_id: gallery2.id,
          drive_file_id: `mock-mq-edited-${i}`,
          file_name: `DSC_820${i}_edited.JPG`,
          thumbnail_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=300&q=80`,
          preview_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=1200&q=85`,
          download_url: `https://images.unsplash.com/photo-${imgIds2[i-1]}?auto=format&fit=crop&w=2400&q=100`,
          kind: "edited",
          selected: false,
          edit_note: null,
        });
      }

      await supabase.from("customer_gallery_photos").insert(minhQuanPhotos);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Lỗi thiết lập." }, { status: 500 });
  }
}
