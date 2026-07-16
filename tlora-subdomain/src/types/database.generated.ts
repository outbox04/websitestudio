// Generated-compatible Release A snapshot. Regenerate from Supabase before production.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  public: {
    Tables: {
      studios: {
        Row: { id: string; slug: string; display_name: string; primary_domain: string | null; plan: string; status: string; owner_user_id: string | null; settings: Json; studio_type: "first_party" | "tenant"; system_key: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; display_name: string; primary_domain?: string | null; plan?: string; status?: string; owner_user_id?: string | null; settings?: Json; studio_type?: "first_party" | "tenant"; system_key?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["studios"]["Insert"]>;
        Relationships: [];
      };
      studio_drive_connections: {
        Row: { studio_id: string; google_account_email: string | null; root_folder_id: string; refresh_token_ciphertext: string; token_expires_at: string | null; connected_by: string | null; created_at: string; updated_at: string };
        Insert: { studio_id: string; google_account_email?: string | null; root_folder_id: string; refresh_token_ciphertext: string; token_expires_at?: string | null; connected_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["studio_drive_connections"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { studio_type: "first_party" | "tenant"; cms_content_status: "draft" | "published" | "archived" };
    CompositeTypes: Record<string, never>;
  };
};

