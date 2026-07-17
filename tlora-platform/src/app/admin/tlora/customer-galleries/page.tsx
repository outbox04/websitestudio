import { CustomerGalleryManager } from "@/components/admin/admin-studio-workspace";
import { loadTloraCustomerGalleryAdminData } from "@/lib/tlora-customer-gallery-admin";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";

export const dynamic = "force-dynamic";

export default async function CustomerGalleriesPage() {
  await requireTloraAdmin();
  const { galleries, editRequests, databaseError } = await loadTloraCustomerGalleryAdminData();

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      {databaseError && (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Chưa đọc được dữ liệu album: {databaseError}
        </div>
      )}
      <CustomerGalleryManager initialGalleries={galleries} editRequests={editRequests} tenantMode={false} />
    </main>
  );
}
