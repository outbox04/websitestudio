# Database refactor map

| Old name | New name | Scope | Source files | Migration | Status |
| --- | --- | --- | --- | --- | --- |
| `studios` | unchanged + `studio_type/system_key` | PLATFORM registry | 39 | Release A | completed in SQL |
| `studio_members` | unchanged | PLATFORM boundary | 11 | none | retained for safety |
| `profiles` | unchanged | SHARED identity | 31 | none | retained for safety |
| `licenses` | unchanged | PLATFORM | 16 | none | retained for API compatibility |
| `devices` | unchanged | PLATFORM | 11 | none | retained |
| `license_renewal_orders` | unchanged | PLATFORM | 9 | none | retained |
| `studio_payment_orders` | unchanged | PLATFORM | 16 | none | retained |
| `posts` with tenant `studio_id` | `posts` | STUDIO | 22 | none | retained |
| `posts` with null `studio_id` | `tlora_cms_posts` | TLORA | 22 | Release A copy | compatibility retained |
| `albums` | unchanged | LEGACY | 11 | none | unresolved data, never dropped |
| `album_photos` | unchanged | LEGACY | 8 | none | unresolved data, never dropped |
| `customer_galleries` | unchanged | STUDIO/TLORA operational | 34 | assign null rows to TLORA | retained |
| `customer_gallery_photos` | unchanged | STUDIO/TLORA operational | 23 | none | retained |
| `studio_google_drive_connections` | `studio_drive_connections` | STUDIO integration | 8 | Release A copy | source migration pending |
| `ai_requests` | unchanged | STUDIO/USER | 13 | none | retained |
| `wallet_transactions` | unchanged | SHARED ledger | 12 | none | retained |
| `wedding_invitations` | unchanged | STUDIO | 12 | none | retained |

New first-party tables: `tlora_cms_pages`, `tlora_cms_page_sections`, `tlora_cms_page_versions`, `tlora_cms_posts`, `tlora_cms_post_categories`, `tlora_cms_post_category_links`, `tlora_cms_post_versions`, `tlora_cms_media_assets`, `tlora_cms_menus`, `tlora_cms_menu_items`, `tlora_cms_settings`, and `tlora_cms_activity_logs`.

