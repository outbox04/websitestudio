# TLORA Studio

## Rental module

The independent `/thue-trang-phuc` module is enabled by default. Set `NEXT_PUBLIC_RENTAL_ENABLED=false` to hide its routes, navigation item, cart, and sitemap entries. Before accepting rental orders, apply [`supabase/rental-module.sql`](./supabase/rental-module.sql) to the production Supabase project. Rental deposits use the existing SePay credentials and IPN endpoint.

Next.js App Router website for TLORA Studio, a concept photo studio with public pages, customer album portal, admin dashboard, Google Drive album sync and AI concept workflow scaffolding.

Brand tagline: `Nơi cá tính trở thành nghệ thuật`.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS v4
- Supabase Auth, Database and Storage
- Google Drive API sync through Vercel API routes
- OpenAI Images API for AI concept generation
- Deploy target: Vercel

## Routes

- `/` public homepage
- `/dich-vu` services
- `/bang-gia` pricing
- `/tin-tuc` and `/tin-tuc/[slug]` mini news channel
- `/cong-khach-hang` protected customer portal
- `/ai-concept` protected AI generator
- `/admin-studio` protected admin/staff dashboard
- `/{ten-khach}` customer gallery generated from the customer name slug
- `/api/admin/customer-galleries` creates TLORA Google Drive folders
- `/api/customer-galleries/[slug]/sync` syncs FILE GỐC and FILE CHỈNH SỬA images
- `/api/google-drive/sync` Google Drive folder image sync
- `/api/ai/generate` OpenAI Images API request entrypoint

## Setup

1. Copy `.env.example` values into `.env.local`.
2. Create Supabase tables from `supabase/schema.sql`.
3. If you already ran an older schema, run `supabase/upgrade-admin-auth.sql`.
4. Run `supabase/ai-concept-wallet.sql` to add AI Concept credit balance and wallet transaction tracking.
5. Create the first admin in Supabase Auth, then run `supabase/admin-auth.sql` after replacing `admin@example.com`.
6. Configure Google Drive service account credentials and `TLORA_DRIVE_ROOT_FOLDER_ID`.
7. Add `OPENAI_API_KEY` for `/api/ai/generate`; optionally change `OPENAI_IMAGE_MODEL`.
8. Connect a real payment gateway before enabling AI Concept wallet top-up; direct balance increments are disabled.

## TLORA Studio Gallery Flow

1. In Google Drive, create the root folder `TLORA`.
2. Share that folder with `GOOGLE_DRIVE_CLIENT_EMAIL` as Editor.
3. Copy the TLORA folder ID into `TLORA_DRIVE_ROOT_FOLDER_ID`.
4. In `/admin-studio`, create a customer gallery with name and shoot date.
5. The app creates `{Tên khách}` with two child folders: `FILE GỐC` and `FILE CHỈNH SỬA`.
6. Upload original photos into `FILE GỐC`, then click sync.
7. Send the customer link, for example `/nguyen-minh-anh`.
8. Keep FILE GỐC downloads locked until payment is complete, then enable the raw download button from admin.
9. Upload final edited photos into `FILE CHỈNH SỬA`, sync again, and the customer can download them in the final tab.

## Development

```bash
npm run dev
npm run lint
npm run build
```

## Deployment

Push the repository to GitHub, import it in Vercel, add the same environment variables and attach the production domain in Vercel Project Settings.

## Structure

```text
src/app              App Router pages, route groups and API routes
src/components       Shared UI, shell, album gallery and AI wizard
src/lib              Supabase, Google Drive, tenant scoping and shared data helpers
supabase             Database schema
workflows            Prompt, rule, preset and workflow assets for AI generation
```
