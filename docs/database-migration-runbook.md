# TLORA database migration runbook

Migration: `sql/20260716_refactor_platform_tlora_studio.sql`

## Backup

1. Create a Supabase PITR/manual backup.
2. Export schema and data with `supabase db dump` or `pg_dump`.
3. Record the current application commit and environment values without copying secrets into logs.
4. Confirm no registration, payment IPN, Drive OAuth callback, or gallery upload job is running.

## Pre-flight

Copy the migration to a reviewed branch and change:

```sql
set local tlora.migration_mode = 'apply';
```

to:

```sql
set local tlora.migration_mode = 'preflight';
```

Run the whole file. It must end with the intentional `pre-flight complete` exception and roll back. Resolve every earlier exception first. Also inspect:

```sql
select studio_id, count(*) from customer_galleries group by studio_id;
select lower(slug), count(*) from studios group by lower(slug) having count(*) > 1;
select lower(primary_domain), count(*) from studios where primary_domain is not null group by lower(primary_domain) having count(*) > 1;
select count(*) from customer_galleries where studio_id is null;
select count(*) from posts where studio_id is null;
select count(*) from albums where studio_id is null;
```

## Apply Release A

1. Restore migration mode to `apply`.
2. Run the migration once from Supabase SQL Editor or `psql`.
3. Verify `platform_migration_runs.status = 'completed'`.
4. Regenerate types:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > tlora-platform/src/types/database.generated.ts
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > tlora-subdomain/src/types/database.generated.ts
```

5. Deploy compatible source only after the SQL transaction commits.
6. Smoke-test login, payment callback, license verify, Drive status, gallery view, TLORA CMS draft and publish.

## Rollback

Release A does not drop or rename operational tables. The safest rollback is restoring the pre-migration backup. For a surgical rollback:

1. Stop source using `tlora_cms_*` and `studio_drive_connections`.
2. Restore `studios` rows from `platform_migration_backups` where required.
3. Keep new CMS tables for forensic recovery; revoke access instead of dropping.
4. Point Drive source back to `studio_google_drive_connections`.
5. Do not set migrated `studio_id` values back to null until gallery URLs and TLORA ownership have been audited.

Never use `DROP ... CASCADE` for rollback.

## Deployment order

1. Database backup.
2. Pre-flight mode.
3. Apply Release A.
4. Generate Supabase types.
5. Deploy platform source.
6. Deploy subdomain source.
7. Run smoke tests.
8. Monitor auth 403s, Drive OAuth failures, gallery 404s, payment IPN and license verification.

