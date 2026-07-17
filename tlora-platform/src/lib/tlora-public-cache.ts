import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export const tloraPublicCacheTags = {
  studio: "tlora-public-studio",
  shell: "tlora-public-shell",
  home: "tlora-public-home",
  albums: "tlora-public-albums",
  categories: "tlora-public-album-categories",
  cms: "tlora-public-cms",
} as const;

function expireTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

export function invalidateTloraPublicAlbums() {
  expireTag(tloraPublicCacheTags.albums);
  expireTag(tloraPublicCacheTags.categories);
  revalidatePath("/");
  revalidatePath("/album-concept");
}

export function invalidateTloraPublicCms() {
  expireTag(tloraPublicCacheTags.home);
  expireTag(tloraPublicCacheTags.cms);
  revalidatePath("/");
  revalidatePath("/album-concept");
}

export function invalidateTloraPublicShell() {
  expireTag(tloraPublicCacheTags.shell);
  revalidatePath("/(public)", "layout");
}
