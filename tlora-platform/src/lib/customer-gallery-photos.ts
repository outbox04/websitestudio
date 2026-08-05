import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const READ_BATCH_SIZE = 1000;

type AdminClient = ReturnType<typeof createAdminClient>;

export async function getAllGalleryPhotos(supabase: AdminClient, galleryId: string) {
  const photos = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("customer_gallery_photos")
      .select("*")
      .eq("gallery_id", galleryId)
      .not("drive_file_id", "like", "mock-%")
      .order("file_name", { ascending: true })
      .range(from, from + READ_BATCH_SIZE - 1);

    if (error) throw error;

    const page = data || [];
    photos.push(...page);
    if (page.length < READ_BATCH_SIZE) break;
    from += READ_BATCH_SIZE;
  }

  return photos;
}

export async function getAllGalleryDriveFileIds(supabase: AdminClient, galleryId: string) {
  const ids: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("customer_gallery_photos")
      .select("drive_file_id")
      .eq("gallery_id", galleryId)
      .range(from, from + READ_BATCH_SIZE - 1);

    if (error) throw error;

    const page = data || [];
    ids.push(...page.map((photo) => photo.drive_file_id));
    if (page.length < READ_BATCH_SIZE) break;
    from += READ_BATCH_SIZE;
  }

  return ids;
}
