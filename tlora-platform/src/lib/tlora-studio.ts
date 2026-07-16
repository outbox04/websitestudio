import "server-only";

import { getFirstPartyStudio } from "@/lib/tenancy/request-context";

export async function requireTloraStudioId() {
  const studio = await getFirstPartyStudio("tlora");
  if (!studio) throw new Error("TLORA first-party studio is not configured. Run Release A migration first.");
  return studio.id;
}

