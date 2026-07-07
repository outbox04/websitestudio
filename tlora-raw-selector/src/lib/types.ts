export type ConnectionState = "connected" | "syncing" | "error" | "disconnected";

export interface IntegrationStatus {
  id: "drive" | "supabase" | "api";
  label: string;
  state: ConnectionState;
  detail: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: keyof typeof import("lucide-react");
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
}

export interface SystemProgressItem {
  id: string;
  label: string;
  done: number;
  total: number;
  tone: "indigo" | "purple" | "success" | "warning";
}
