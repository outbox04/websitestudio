begin;

create table if not exists public.tlora_cms_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete restrict,
  username text not null,
  display_name text not null,
  backup_email text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (studio_id, username)
);

alter table public.tlora_cms_users enable row level security;
drop policy if exists "TLORA admins manage CMS users" on public.tlora_cms_users;
create policy "TLORA admins manage CMS users"
on public.tlora_cms_users for all to authenticated
using (public.can_manage_tlora_cms())
with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

with tlora as (
  select id from public.studios
  where studio_type = 'first_party' and system_key = 'tlora'
)
insert into public.tlora_cms_pages (
  studio_id, page_key, slug, title, status,
  draft_seo_title, draft_seo_description, draft_og_image_url,
  seo_title, seo_description, og_image_url, published_at
)
select tlora.id, seed.page_key, seed.slug, seed.title, 'published',
       seed.seo_title, seed.seo_description, '', seed.seo_title, seed.seo_description, '', now()
from tlora
cross join (values
  ('services', '/dich-vu', 'Dịch vụ', 'Dịch vụ chụp ảnh concept | TLORA', 'Chọn concept chân dung, couple, gia đình và thời trang phù hợp với phong cách của bạn.'),
  ('pricing', '/bang-gia', 'Bảng giá', 'Bảng giá chụp ảnh concept | TLORA', 'Các gói chụp rõ số concept, thời lượng và số ảnh nhận được để bạn dễ lựa chọn.'),
  ('news', '/tin-tuc', 'Tin tức', 'Cảm hứng chụp ảnh concept | TLORA', 'Gợi ý chọn concept, chuẩn bị trang phục và tạo dáng cho bộ ảnh của bạn.'),
  ('albums', '/album-concept', 'Album Concept', 'Album Concept | TLORA', 'Khám phá những bộ ảnh concept tiêu biểu và đăng ký tư vấn phong cách phù hợp.')
) as seed(page_key, slug, title, seo_title, seo_description)
on conflict (studio_id, page_key) do nothing;

commit;
