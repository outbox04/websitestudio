import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TloraCmsUserRow = {
  user_id: string;
  username: string;
  display_name: string;
  backup_email: string | null;
  role: "owner" | "admin" | "staff";
  is_active: boolean;
  postCount: number;
  source: "cms" | "studio";
};

type MemberRow = {
  user_id: string;
  role: TloraCmsUserRow["role"];
  is_active: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
};

type CmsRow = {
  user_id: string;
  username: string;
  display_name: string;
  backup_email: string | null;
};

export async function listTloraCmsUsers(studioId: string): Promise<TloraCmsUserRow[]> {
  const admin = createAdminClient();
  const { data: memberData, error: memberError } = await admin
    .from("studio_members")
    .select("user_id,role,is_active,created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });
  if (memberError) throw memberError;

  const members = (memberData || []) as MemberRow[];
  if (!members.length) return [];
  const userIds = members.map((member) => member.user_id);

  const [{ data: profileData, error: profileError }, { data: cmsData, error: cmsError }, { data: postData, error: postError }] = await Promise.all([
    admin.from("profiles").select("id,username,full_name,email").in("id", userIds),
    admin.from("tlora_cms_users").select("user_id,username,display_name,backup_email").eq("studio_id", studioId).in("user_id", userIds),
    admin.from("tlora_cms_posts").select("created_by").eq("studio_id", studioId).in("created_by", userIds),
  ]);
  if (profileError) throw profileError;
  if (cmsError) throw cmsError;
  if (postError) throw postError;

  const profiles = new Map(((profileData || []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const cmsUsers = new Map(((cmsData || []) as CmsRow[]).map((user) => [user.user_id, user]));
  const postCounts = new Map<string, number>();
  for (const post of postData || []) {
    if (post.created_by) postCounts.set(post.created_by, (postCounts.get(post.created_by) || 0) + 1);
  }

  return members.map((member) => {
    const profile = profiles.get(member.user_id);
    const cmsUser = cmsUsers.get(member.user_id);
    const username = cmsUser?.username || profile?.username || profile?.email || member.user_id;
    return {
      user_id: member.user_id,
      username,
      display_name: cmsUser?.display_name || profile?.full_name || username,
      backup_email: cmsUser?.backup_email || (profile?.email?.endsWith("@accounts.tlgroup.site") ? null : profile?.email) || null,
      role: member.role,
      is_active: member.is_active,
      postCount: postCounts.get(member.user_id) || 0,
      source: cmsUser ? "cms" : "studio",
    };
  });
}
