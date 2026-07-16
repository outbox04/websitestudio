# TLORA security, performance and UX audit

Date: 2026-07-17

## Architecture reviewed

- Two Next.js 16 App Router applications: the first-party platform/CMS and the tenant subdomain application.
- Supabase Auth, PostgreSQL/RLS, Storage, and service-role server routes.
- Google Drive service account plus per-studio OAuth connections.
- SePay checkout/IPN, VietQR HTTP APIs, Gmail OAuth and OpenAI image generation.
- First-party TLORA CMS, public concept pages and private customer galleries.

## High-risk findings fixed

1. Private gallery routes only scoped by studio and slug. A guessed slug could reach page data and mutation/download APIs.
   - Every public gallery page and API now requires the 48-character `share_token`.
   - The token is propagated through selection, notes, sync, payment and download operations.
   - Gallery metadata is `noindex, nofollow`.
   - Apply `sql/20260717_security_hardening.sql` to remove legacy anonymous Supabase policies.

2. SePay IPN trusted JSON without authenticating the caller.
   - IPN now fails closed unless `SEPAY_IPN_SECRET` is configured.
   - Requests must match SePay's `X-Secret-Key`.
   - Paid orders return an idempotent success response rather than running provisioning again.
   - Configure the SePay merchant IPN authentication type as `SECRET_KEY`.

3. Upload endpoints trusted the browser-supplied MIME type.
   - JPEG, PNG and WebP are now identified from binary magic bytes.
   - File size limits and normalized storage names are enforced server-side.
   - The TLORA desktop/API integration now fails closed when `TLORA_API_KEY` is missing.

4. An unauthenticated Google Drive sync endpoint accepted arbitrary folder IDs.
   - The endpoint now requires a studio auth context and confirms that the folder belongs to that studio.

5. Public enumeration and expensive endpoints had no abuse control.
   - Best-effort rate limits were added to username resolution, registration availability, concept inquiries and AI generation.
   - For multi-instance production, replace the in-memory bucket with Redis/Upstash or a database-backed limiter.

6. Security response headers were missing.
   - CSP, HSTS, nosniff, same-origin framing, referrer policy and permissions policy are now applied in both apps.
   - `unsafe-inline` remains in `script-src`/`style-src` because the current Next hydration and generated styles use inline content. Moving to request nonces is a future hardening task.

7. `vietqr` was installed but unused and pulled a severely outdated Axios version.
   - The package and its declaration files were removed. Existing QR generation still calls the official VietQR HTTP endpoint.
   - Next.js was updated from 16.2.7 to 16.2.10 and PostCSS is overridden to the patched 8.5.x line.
   - `npm audit` reports zero known vulnerabilities in both applications after reinstall.

## Auth, tenancy and RLS assessment

- Admin requests resolve the authenticated user and active profile.
- Tenant management routes resolve active `studio_members` and scope database work by `studio_id`.
- First-party CMS routes use the TLORA first-party studio resolver and role checks.
- The current Release A migration removes the old public customer-gallery policies and creates studio-member policies.
- Some historical SQL snapshots still contain permissive policies. They are context-only and must not be used for a new production deployment. Use the dated migrations in order, ending with `20260717_security_hardening.sql`.
- Service-role credentials remain server-only. No secret-prefixed variable is exposed through `NEXT_PUBLIC_*`.

## Integrations

- Google OAuth state is HMAC-signed, expires after ten minutes, and refresh tokens use AES-256-GCM at rest.
- SePay secret verification now follows the payment-gateway IPN contract.
- No Telegram integration or Telegram credential exists in the reviewed source, so no runtime Telegram path could be tested.
- Gmail and OpenAI credentials are read only on the server.

## Performance and UX

- The broken mobile navigation button on the first-party website now opens an accessible menu with 44px targets, active state and correct ARIA attributes.
- Gallery tabs are local state transitions; they do not wait for an API request. Background Drive sync remains isolated from tab switching.
- Images still use several `unoptimized` paths because Google Drive thumbnail URLs are dynamic. A future improvement is a signed image proxy/cache rather than blindly enabling optimization for all remote URLs.
- Large ZIP downloads stream instead of buffering the full archive in memory.

## Verification

- TypeScript: both applications pass.
- ESLint: both applications pass.
- Security helper tests: 4 passing tests for magic-byte validation, forged uploads, safe filenames and rate limiting.
- Legacy database reference check: passing.
- Dependency audit: zero known vulnerabilities after the dependency changes.
- Production builds: both applications pass on Next.js 16.2.10. The only remaining build warning is that Next.js has no generated fallback metrics for Google Sans/Google Sans Code.

## Deployment

1. Back up the Supabase database.
2. Apply migrations in chronological order, ending with:
   - `sql/20260717_security_hardening.sql`
   - `sql/20260718_tlora_concept_categories.sql`
3. Set and verify:
   - `SEPAY_IPN_SECRET`
   - `TLORA_API_KEY`
   - `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`
   - `GOOGLE_DRIVE_OAUTH_STATE_SECRET`
   - all existing Supabase, Google, Gmail, SePay and OpenAI server variables
4. Configure SePay IPN to send `X-Secret-Key` with the exact `SEPAY_IPN_SECRET`.
5. Run:

   ```text
   npm run test:security
   npm run check:db-refs
   npm run lint:platform
   npm run lint:subdomain
   npm run build:platform
   npm run build:subdomain
   ```

## Rollback

- Roll back the application release first if a runtime regression appears.
- Do not restore the anonymous gallery policies during rollback. Existing admin album management continues through authenticated/service-role routes.
- If tokenized links were not previously sent to customers, regenerate/copy the customer URL from Album Management; it already includes `?token=...`.
- Keep the new secret variables in place even if the UI release is rolled back.
