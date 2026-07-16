import { TloraConceptAlbumsManager } from "@/components/tlora-cms/tlora-concept-albums-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraConceptAlbums, listTloraConceptCategories } from "@/repositories/tlora/concept-albums-repository";
import { listTloraMedia } from "@/repositories/tlora/media-repository";

export const dynamic = "force-dynamic";

export default async function TloraConceptAlbumsAdminPage() {
  const context = await requireTloraAdmin();
  const [albums, media, categories] = await Promise.all([
    listTloraConceptAlbums(context.studio.id),
    listTloraMedia(context.studio.id),
    listTloraConceptCategories(context.studio.id),
  ]);
  return <TloraConceptAlbumsManager initialAlbums={albums} initialMedia={media} categories={categories} />;
}
