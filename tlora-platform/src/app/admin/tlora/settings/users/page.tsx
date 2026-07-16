import { TloraSettingsSubnav } from "@/components/tlora-cms/tlora-settings-subnav";
import { TloraUsersManager } from "@/components/tlora-cms/tlora-users-manager";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export default async function UsersPage(){const context=await requireTloraAdmin();const admin=createAdminClient();const[{data:users},{data:posts}]=await Promise.all([admin.from("tlora_cms_users").select("user_id,username,display_name,backup_email").eq("studio_id",context.studio.id).order("created_at",{ascending:false}),admin.from("tlora_cms_posts").select("created_by").eq("studio_id",context.studio.id)]);return <><TloraSettingsSubnav/><TloraUsersManager initialUsers={(users||[]).map(user=>({...user,postCount:(posts||[]).filter(post=>post.created_by===user.user_id).length}))}/></>}
