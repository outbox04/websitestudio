# TLORA source and database audit

Audit date: 2026-07-16  
Scope: `tlora-platform`, `tlora-subdomain`, every SQL file under both `supabase/` folders, and the supplied schema snapshot.

## Current architecture

`tlora-platform` owns the TLORA public website, registration/payment, licensing, AI and the platform console. `tlora-subdomain` resolves tenant hosts and renders tenant websites and studio administration. Both applications currently duplicate most server libraries, APIs, components, and SQL.

The current request boundary is host-based in `tlora-subdomain/src/proxy.ts`. A subdomain is rewritten to `/studio-site/[studioSlug]`. Authorization then queries `studios` and `studio_members`. Platform authorization uses `profiles.is_platform_admin`. Service-role clients are used by most route handlers, so route-level scoping is security-critical.

No Telegram client, bot token, chat ID, message builder, webhook, or notification sender was found. Telegram is therefore `UNRESOLVED / NOT IMPLEMENTED`, not silently treated as working.

Google Drive is server-only. The encrypted refresh token is read only by `studio-google-drive.ts` and the OAuth callback. The connection is scoped by `studio_id`, but source used the legacy table name `studio_google_drive_connections`.

## Database classification

| Current table | Current scope | Correct scope | Rename now | Target name | Runtime evidence | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `studios` | Mixed core/tenant | PLATFORM tenant registry | No | `studios` | 39 files; host, checkout, admin | Critical |
| `studio_members` | Tenant membership | PLATFORM boundary | No | `studio_members` | auth, Drive callback, payment activation | Critical |
| `profiles` | User/platform | SHARED user identity | No | `profiles` | 31 files; auth, AI, checkout | Critical |
| `licenses` | Platform | PLATFORM | No | `licenses` | license APIs and payment IPN | Critical |
| `devices` | Platform | PLATFORM | No | `devices` | activate/verify | High |
| `license_renewal_orders` | Platform | PLATFORM | No | `license_renewal_orders` | renewal checkout and IPN | High |
| `studio_payment_orders` | Platform sales | PLATFORM | No | `studio_payment_orders` | registration and SePay | Critical |
| `payment_settings` | Global platform | PLATFORM | No | `payment_settings` | payment APIs | High |
| `posts` | Studio plus null TLORA | TENANT + LEGACY TLORA | No in A | `posts`; TLORA rows copied to `tlora_cms_posts` | tenant news and TLORA public news | High |
| `post_likes` | Legacy engagement | LEGACY/SHARED | No | unchanged | TLORA public article only | Medium |
| `post_comments` | Legacy engagement | LEGACY/SHARED | No | unchanged | TLORA public article only | Medium |
| `albums` | Legacy album model | LEGACY | No | unchanged | only old TLORA API/SQL | High |
| `album_photos` | Legacy album photos | LEGACY | No | unchanged | SQL only | High |
| `customer_galleries` | Operational albums | STUDIO operational | No in A | unchanged | 34 files, all gallery flows | Critical |
| `customer_gallery_photos` | Operational photos | STUDIO operational | No in A | unchanged | 23 files | Critical |
| `ai_requests` | User + studio | STUDIO/USER | No | unchanged | AI generate/page | High |
| `wallet_transactions` | User credit + studio attribution | SHARED/PLATFORM ledger | No | unchanged | AI charging | High |
| `studio_google_drive_connections` | Studio integration | STUDIO | Copy | `studio_drive_connections` | OAuth and token repository | Critical |
| `wedding_invitations` | Studio feature | STUDIO | No | unchanged | tenant/public/admin routes | Medium |

## Duplicate domain decision

`albums/album_photos` and `customer_galleries/customer_gallery_photos` overlap conceptually but not structurally. The former is a user-account album with a single Drive folder. The latter is the active studio delivery workflow with raw/edited folders, payments, download permissions and anonymous customer URLs. Release A keeps both and marks the first pair legacy. No records are deleted.

## Source reference inventory

| Table | Files containing references |
| --- | ---: |
| `studios` | 39 |
| `customer_galleries` | 34 |
| `profiles` | 31 |
| `customer_gallery_photos` | 23 |
| `posts` | 22 |
| `licenses` | 16 |
| `studio_payment_orders` | 16 |
| `ai_requests` | 13 |
| `wallet_transactions` | 12 |
| `wedding_invitations` | 12 |
| `albums` | 11 |
| `devices` | 11 |
| `studio_members` | 11 |
| `license_renewal_orders` | 9 |
| `album_photos` | 8 |
| `studio_google_drive_connections` | 8 |
| `post_likes` | 5 |
| `post_comments` | 5 |

The precise file list can be regenerated with:

```powershell
$tables = @("profiles","posts","post_likes","post_comments","albums","album_photos","customer_galleries","customer_gallery_photos","ai_requests","wallet_transactions","licenses","devices","studio_payment_orders","studios","studio_members","studio_google_drive_connections","license_renewal_orders","wedding_invitations")
foreach ($table in $tables) { rg -l -F $table tlora-platform/src tlora-subdomain/src tlora-platform/supabase tlora-subdomain/supabase }
```

## Existing RLS and identified gaps

- `is_platform_operator`, `is_studio_member`, and `can_manage_studio` exist and are retained.
- Older migrations grant public read to all galleries/photos. This must not be reapplied.
- Current public gallery routes use service role and gallery slug. A new `share_token` is introduced, but enforcing it requires a separate customer-link rollout to avoid breaking existing links.
- `posts` has public `published = true` access without a first-party/tenant boundary. New TLORA content is isolated in `tlora_cms_*`.
- Drive refresh tokens have no client write policy in the new table.
- TLORA CMS allows public reads only for published content and writes only for platform admins or active TLORA owner/admin members.

## Release plan

### Release A

- Add `studio_type` and `system_key`.
- Seed exactly one `first_party/tlora` studio.
- Move null operational data to the TLORA studio.
- Create `tlora_cms_*`, RLS, storage policies, page versioning and publish RPC.
- Copy Drive connections into `studio_drive_connections`; retain the old table.
- Add gallery share tokens without enforcing them yet.

### Release B

- Deploy scoped request context and TLORA CMS routes.
- Move TLORA public pages from static/legacy data to published CMS repositories.
- Switch Drive server code to `studio_drive_connections`.
- Introduce share-token URLs and then require tokens in public gallery APIs.
- Regenerate Supabase types against the migrated project.

### Release C

- Verify the legacy-reference script is clean.
- Disable old Drive writes and replace the old table with a compatibility view if required.
- Archive legacy albums only after record-level reconciliation.
- Remove null-studio compatibility behavior and obsolete admin routes.

## Unverified items

- Live production row counts and orphan/duplicate results.
- Supabase project-generated TypeScript types (no project ID/access token is present locally).
- Storage object inventory and existing bucket policies.
- External cron jobs, Edge Functions, webhooks or Telegram infrastructure not present in this repository.
- Whether existing customer gallery URLs are distributed externally; therefore share-token enforcement is deferred.

