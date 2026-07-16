// Generated-compatible Release A snapshot based on the supplied schema.
// Regenerate from the migrated Supabase project before production deployment.
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
      studio_members: {
        Row: { studio_id: string; user_id: string; role: "owner" | "admin" | "staff"; is_active: boolean; created_at: string; updated_at: string };
        Insert: { studio_id: string; user_id: string; role?: "owner" | "admin" | "staff"; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["studio_members"]["Insert"]>;
        Relationships: [];
      };
      studio_drive_connections: {
        Row: { studio_id: string; google_account_email: string | null; root_folder_id: string; refresh_token_ciphertext: string; token_expires_at: string | null; connected_by: string | null; created_at: string; updated_at: string };
        Insert: { studio_id: string; google_account_email?: string | null; root_folder_id: string; refresh_token_ciphertext: string; token_expires_at?: string | null; connected_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["studio_drive_connections"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_pages: {
        Row: { id: string; studio_id: string; page_key: string; slug: string; title: string; status: "draft" | "published" | "archived"; draft_seo_title: string | null; draft_seo_description: string | null; draft_og_image_url: string | null; seo_title: string | null; seo_description: string | null; og_image_url: string | null; published_at: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; page_key: string; slug: string; title: string; status?: "draft" | "published" | "archived"; draft_seo_title?: string | null; draft_seo_description?: string | null; draft_og_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; og_image_url?: string | null; published_at?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_pages"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_page_sections: {
        Row: { id: string; page_id: string; section_key: string; section_type: string; draft_content: Json; published_content: Json; schema_version: number; is_enabled: boolean; sort_order: number; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; page_id: string; section_key: string; section_type: string; draft_content?: Json; published_content?: Json; schema_version?: number; is_enabled?: boolean; sort_order?: number; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_page_sections"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_posts: {
        Row: { id: string; studio_id: string; legacy_post_id: string | null; slug: string; title: string; excerpt: string | null; draft_content: Json; published_content: Json; cover_image_url: string | null; seo_title: string | null; seo_description: string | null; keywords: string[]; status: "draft" | "published" | "archived"; published_at: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; legacy_post_id?: string | null; slug: string; title: string; excerpt?: string | null; draft_content?: Json; published_content?: Json; cover_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; keywords?: string[]; status?: "draft" | "published" | "archived"; published_at?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_posts"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_post_categories: {
        Row: { id: string; studio_id: string; slug: string; name: string; description: string | null; created_at: string };
        Insert: { id?: string; studio_id: string; slug: string; name: string; description?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_post_categories"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_post_category_links: {
        Row: { post_id: string; category_id: string };
        Insert: { post_id: string; category_id: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_post_category_links"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_media_assets: {
        Row: { id: string; studio_id: string; storage_bucket: string; storage_path: string; public_url: string | null; file_name: string; mime_type: string; size_bytes: number; width: number | null; height: number | null; alt_text: string | null; metadata: Json; created_by: string | null; created_at: string };
        Insert: { id?: string; studio_id: string; storage_bucket?: string; storage_path: string; public_url?: string | null; file_name: string; mime_type: string; size_bytes: number; width?: number | null; height?: number | null; alt_text?: string | null; metadata?: Json; created_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_media_assets"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_menus: {
        Row: { id: string; studio_id: string; menu_key: string; name: string; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; menu_key: string; name: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_menus"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_menu_items: {
        Row: { id: string; menu_id: string; parent_id: string | null; label: string; href: string; is_enabled: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; menu_id: string; parent_id?: string | null; label: string; href: string; is_enabled?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_menu_items"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_settings: {
        Row: { id: string; studio_id: string; setting_key: string; draft_value: Json; published_value: Json; schema_version: number; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; setting_key: string; draft_value?: Json; published_value?: Json; schema_version?: number; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_settings"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_activity_logs: {
        Row: { id: number; studio_id: string; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; before_value: Json | null; after_value: Json | null; request_id: string | null; created_at: string };
        Insert: { id?: never; studio_id: string; actor_user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; before_value?: Json | null; after_value?: Json | null; request_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_activity_logs"]["Insert"]>;
        Relationships: [];
      };
      tlora_concept_albums: {
        Row: { id: string; studio_id: string; slug: string; title: string; excerpt: string; cover_image_url: string | null; images: Json; is_featured: boolean; sort_order: number; status: "draft" | "published" | "archived"; published_at: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; slug: string; title: string; excerpt?: string; cover_image_url?: string | null; images?: Json; is_featured?: boolean; sort_order?: number; status?: "draft" | "published" | "archived"; published_at?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_concept_albums"]["Insert"]>;
        Relationships: [];
      };
      tlora_concept_inquiries: {
        Row: { id: string; studio_id: string; album_id: string | null; customer_name: string; phone: string; email: string | null; note: string | null; status: string; created_at: string };
        Insert: { id?: string; studio_id: string; album_id?: string | null; customer_name: string; phone: string; email?: string | null; note?: string | null; status?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_concept_inquiries"]["Insert"]>;
        Relationships: [];
      };
      tlora_cms_users: {
        Row: { user_id: string; studio_id: string; username: string; display_name: string; backup_email: string | null; created_by: string | null; created_at: string };
        Insert: { user_id: string; studio_id: string; username: string; display_name: string; backup_email?: string | null; created_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tlora_cms_users"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_manage_tlora_cms: { Args: Record<PropertyKey, never>; Returns: boolean };
      get_first_party_studio: { Args: { target_system_key?: string }; Returns: Database["public"]["Tables"]["studios"]["Row"] };
      is_tlora_studio: { Args: { target_studio_id: string }; Returns: boolean };
      publish_tlora_cms_page: { Args: { target_page_id: string; change_note?: string | null }; Returns: undefined };
      get_tlora_public_page: { Args: { target_page_key?: string }; Returns: Json };
      get_tlora_public_post: { Args: { target_slug: string }; Returns: Json };
      list_tlora_public_posts: { Args: Record<PropertyKey, never>; Returns: Json[] };
    };
    Enums: {
      studio_type: "first_party" | "tenant";
      cms_content_status: "draft" | "published" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
};
