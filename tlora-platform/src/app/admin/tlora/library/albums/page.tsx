import { TloraConceptAlbumsManager } from "@/components/tlora-cms/tlora-concept-albums-manager";
import { TloraLibrarySubnav } from "@/components/tlora-cms/tlora-library-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraConceptAlbums, listTloraConceptCategories } from "@/repositories/tlora/concept-albums-repository";
import { listTloraMedia } from "@/repositories/tlora/media-repository";
export const dynamic = "force-dynamic";
export default async function LibraryAlbumsPage() { const context = await requireTloraAdmin(); const [albums,media,categories] = await Promise.all([listTloraConceptAlbums(context.studio.id),listTloraMedia(context.studio.id),listTloraConceptCategories(context.studio.id)]); return <><TloraLibrarySubnav /><TloraConceptAlbumsManager initialAlbums={albums} initialMedia={media} categories={categories} /></>; }
