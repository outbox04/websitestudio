import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateTloraPublicShell } from "@/lib/tlora-public-cache";
import type { TloraCmsMenu, TloraCmsMenuItem } from "@/types/scope";

export async function getTloraMenu(studioId: string, menuKey = "primary"): Promise<TloraCmsMenu> {
  const admin = createAdminClient();
  const { data: menu, error } = await admin
    .from("tlora_cms_menus")
    .select("id,menu_key,name")
    .eq("studio_id", studioId)
    .eq("menu_key", menuKey)
    .single();
  if (error) throw error;
  const { data: items, error: itemsError } = await admin
    .from("tlora_cms_menu_items")
    .select("id,label,href,is_enabled,sort_order")
    .eq("menu_id", menu.id)
    .order("sort_order");
  if (itemsError) throw itemsError;
  return {
    id: menu.id,
    menuKey: menu.menu_key,
    name: menu.name,
    items: (items || []).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      isEnabled: item.is_enabled,
      sortOrder: item.sort_order,
    })),
  };
}

export async function replaceTloraMenuItems(studioId: string, userId: string, menuId: string, items: TloraCmsMenuItem[]) {
  const admin = createAdminClient();
  const { data: menu, error: menuError } = await admin
    .from("tlora_cms_menus")
    .select("id")
    .eq("id", menuId)
    .eq("studio_id", studioId)
    .single();
  if (menuError || !menu) throw menuError || new Error("Menu not found");

  const existingIds = items.flatMap((item) => item.id ? [item.id] : []);
  let deleteQuery = admin.from("tlora_cms_menu_items").delete().eq("menu_id", menuId);
  if (existingIds.length) deleteQuery = deleteQuery.not("id", "in", `(${existingIds.join(",")})`);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  for (const item of items) {
    const values = {
      menu_id: menuId,
      label: item.label,
      href: item.href,
      is_enabled: item.isEnabled,
      sort_order: item.sortOrder,
    };
    const { error } = item.id
      ? await admin.from("tlora_cms_menu_items").update(values).eq("id", item.id).eq("menu_id", menuId)
      : await admin.from("tlora_cms_menu_items").insert(values);
    if (error) throw error;
  }

  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId,
    actor_user_id: userId,
    action: "menu.updated",
    entity_type: "menu",
    entity_id: menuId,
    after_value: items,
  });
  invalidateTloraPublicShell();
  return getTloraMenu(studioId);
}
