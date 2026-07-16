begin;

alter table public.tlora_cms_pages
  add column if not exists draft_seo_title text,
  add column if not exists draft_seo_description text,
  add column if not exists draft_og_image_url text,
  add column if not exists og_image_url text;

update public.tlora_cms_pages
set draft_seo_title = coalesce(draft_seo_title, seo_title),
    draft_seo_description = coalesce(draft_seo_description, seo_description),
    draft_og_image_url = coalesce(draft_og_image_url, og_image_url);

create or replace function public.publish_tlora_cms_page(target_page_id uuid, change_note text default null)
returns void language plpgsql security definer set search_path = public
as $$
declare
  snapshot_value jsonb;
begin
  if not public.can_manage_tlora_cms() then raise exception 'forbidden'; end if;
  if not exists (
    select 1 from public.tlora_cms_pages p
    where p.id = target_page_id and public.is_tlora_studio(p.studio_id)
  ) then raise exception 'invalid TLORA page'; end if;

  select jsonb_build_object(
    'page', to_jsonb(p),
    'sections', coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order), '[]'::jsonb)
  ) into snapshot_value
  from public.tlora_cms_pages p
  left join public.tlora_cms_page_sections s on s.page_id = p.id
  where p.id = target_page_id
  group by p.id;

  insert into public.tlora_cms_page_versions(page_id, snapshot, change_note, created_by)
  values (target_page_id, snapshot_value, change_note, auth.uid());

  update public.tlora_cms_page_sections
  set published_content = draft_content, updated_at = now(), updated_by = auth.uid()
  where page_id = target_page_id;

  update public.tlora_cms_pages
  set status = 'published',
      seo_title = draft_seo_title,
      seo_description = draft_seo_description,
      og_image_url = draft_og_image_url,
      published_at = now(),
      updated_at = now(),
      updated_by = auth.uid()
  where id = target_page_id;
end
$$;

commit;
