import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TloraCmsActivity = {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  createdAt: string;
};

export async function listTloraActivity(studioId: string, limit = 100): Promise<TloraCmsActivity[]> {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_activity_logs")
    .select("id,action,entity_type,entity_id,actor_user_id,created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id as number,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string | null,
    actorUserId: row.actor_user_id as string | null,
    createdAt: row.created_at as string,
  }));
}

