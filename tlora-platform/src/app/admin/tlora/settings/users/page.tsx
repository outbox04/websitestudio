import { TloraSettingsSubnav } from "@/components/tlora-cms/tlora-settings-subnav";
import { TloraUsersManager } from "@/components/tlora-cms/tlora-users-manager";
import { listTloraCmsUsers } from "@/lib/tlora-cms-users";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const context = await requireTloraAdmin();
  return (
    <>
      <TloraSettingsSubnav />
      <TloraUsersManager initialUsers={await listTloraCmsUsers(context.studio.id)} />
    </>
  );
}
