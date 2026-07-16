import { TloraConceptCategoriesManager } from "@/components/tlora-cms/tlora-concept-categories-manager";
import { TloraLibrarySubnav } from "@/components/tlora-cms/tlora-library-subnav";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraConceptCategories } from "@/repositories/tlora/concept-albums-repository";

export const dynamic = "force-dynamic";

export default async function ConceptCategoriesPage() {
  const context = await requireTloraAdmin();
  return <><TloraLibrarySubnav /><TloraConceptCategoriesManager initialCategories={await listTloraConceptCategories(context.studio.id)} /></>;
}
