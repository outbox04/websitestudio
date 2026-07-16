# Release B — TLORA First-party CMS

Release B moves all first-party website editing away from legacy `posts` and `studios.settings`.

## Modules

- `/admin/tlora`: constrained page sections, draft preview, page publish and versions.
- `/admin/tlora/posts`: post draft, taxonomy assignment, publish/version and archive.
- `/admin/tlora/categories`: TLORA-only post taxonomy.
- `/admin/tlora/media`: server-side Storage uploads and media metadata.
- `/admin/tlora/menus`: first-party navigation items.
- `/admin/tlora/settings`: draft/published contact, branding and SEO defaults.
- `/admin/tlora/activity`: immutable CMS activity trail.

## Public reads

- Homepage hero reads only `published_content`.
- News listing/article reads only published TLORA CMS posts.
- Header menu reads enabled TLORA menu items.
- Footer reads `published_value` from TLORA site settings.
- Anonymous database access to section/post/settings base tables is intentionally absent. Public database consumers must use `get_tlora_public_page`, `get_tlora_public_post`, or `list_tlora_public_posts`.

## Tenant boundary

- Tenant `/quan-tri` accepts only `studios.studio_type = tenant`.
- TLORA first-party administration is available only under `/admin/tlora`.
- Platform admin gallery APIs resolve the TLORA studio ID instead of relying on `studio_id IS NULL`.
- `/api/tlora/*` is scoped to the TLORA first-party studio.
- Legacy `/api/admin/posts` returns HTTP 410 for first-party usage; tenant posts remain compatible.

## Gallery link transition

Release A backfills a unique `share_token`, and all gallery page, photo, sync, payment and download requests now enforce and propagate it. Old customer links without `?token=...` intentionally return not found; copy the current private link again from Album Management.

## Deployment

1. Run Release A database migration.
   - If Release A was already applied before direct-preview OG editing was added, also run `sql/20260716_add_tlora_page_og_image.sql`.
   - Run `sql/20260716_add_tlora_concept_albums.sql` to enable the Album Concept library, featured homepage albums and consultation submissions.
   - Run `sql/20260717_expand_tlora_cms.sql` to seed page-level OG metadata and enable CMS user management.
   - Run `sql/20260717_security_hardening.sql` to enforce private gallery access and transaction uniqueness.
   - Run `sql/20260718_tlora_concept_categories.sql` to add Concept categories, album assignment and consultation shooting dates.
2. Regenerate Supabase types.
3. Deploy platform and subdomain together because both now read `studio_type` and `studio_drive_connections`.
4. Smoke-test the modules above.
5. Confirm TLORA albums remain visible in `/admin-studio`.
6. Confirm tenant `/quan-tri` cannot resolve the first-party TLORA studio.

## Local verification

- Legacy database reference checker: passed.
- ESLint for `tlora-platform`: passed with no warnings.
- ESLint for `tlora-subdomain`: passed with no warnings.
- TypeScript for both applications: passed.
- Next.js production build for both applications: passed.
- The migration has not been executed against a remote Supabase project; follow `database-migration-runbook.md` before deployment.
