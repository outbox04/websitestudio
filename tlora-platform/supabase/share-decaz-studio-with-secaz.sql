-- Give secaztran@gmail.com admin access to the same studio as decaztran@gmail.com.
-- Run once in the Supabase SQL Editor. Safe to run again (UPSERT).

begin;

do $$
declare
  v_owner_user_id uuid;
  v_shared_user_id uuid;
  v_target_studio_id uuid;
begin
  select id into v_owner_user_id
  from auth.users
  where lower(email) = 'decaztran@gmail.com'
  order by created_at
  limit 1;

  if v_owner_user_id is null then
    raise exception 'Không tìm thấy tài khoản decaztran@gmail.com';
  end if;

  select id into v_shared_user_id
  from auth.users
  where lower(email) = 'secaztran@gmail.com'
  order by created_at
  limit 1;

  if v_shared_user_id is null then
    raise exception 'Không tìm thấy tài khoản secaztran@gmail.com';
  end if;

  -- Prefer the owner's selected studio, then an active owner/admin membership,
  -- then a studio owned by that user, and finally the studio bound to a license.
  select coalesce(
    (select default_studio_id from public.profiles where id = v_owner_user_id),
    (
      select studio_id
      from public.studio_members
      where user_id = v_owner_user_id
        and is_active = true
        and role in ('owner', 'admin')
      order by case role when 'owner' then 0 else 1 end, created_at
      limit 1
    ),
    (
      select id
      from public.studios
      where owner_user_id = v_owner_user_id
      order by created_at
      limit 1
    ),
    (
      select studio_id
      from public.licenses
      where user_id = v_owner_user_id
        and studio_id is not null
      order by created_at desc
      limit 1
    )
  ) into v_target_studio_id;

  if v_target_studio_id is null then
    raise exception 'Tài khoản decaztran@gmail.com chưa được gắn với studio nào';
  end if;

  insert into public.studio_members (studio_id, user_id, role, is_active)
  values (v_target_studio_id, v_shared_user_id, 'admin', true)
  on conflict (studio_id, user_id) do update
  set role = 'admin', is_active = true, updated_at = now();

  update public.profiles
  set default_studio_id = v_target_studio_id,
      role = 'admin',
      is_active = true
  where id = v_shared_user_id;

  raise notice 'Đã cấp quyền admin studio % cho secaztran@gmail.com', v_target_studio_id;
end $$;

commit;

-- Verification: both accounts should return the same studio_id.
select
  u.email,
  m.studio_id,
  s.display_name as studio_name,
  m.role,
  m.is_active,
  p.default_studio_id
from auth.users u
join public.profiles p on p.id = u.id
join public.studio_members m on m.user_id = u.id
join public.studios s on s.id = m.studio_id
where lower(u.email) in ('decaztran@gmail.com', 'secaztran@gmail.com')
order by m.studio_id, u.email;
