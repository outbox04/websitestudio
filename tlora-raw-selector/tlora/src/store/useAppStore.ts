import { create } from "zustand";
import type { IntegrationStatus } from "@/lib/types";

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Mocked for the UI shell — will be driven by real connectors later.
  integrations: IntegrationStatus[];
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  integrations: [],
}));
