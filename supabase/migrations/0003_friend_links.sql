-- Public friend links expose only a deliberately shared profile preview.
-- The token is the capability; profile rows remain protected by profiles RLS.
create table public.friend_links (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.friend_links enable row level security;
revoke all on table public.friend_links from anon, authenticated;

create policy "friend link owner" on public.friend_links
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create or replace function public.get_or_create_friend_link()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  link_token text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.friend_links (profile_id)
  values (caller_id)
  on conflict (profile_id) do update set revoked_at = null;

  select token into link_token
  from public.friend_links
  where profile_id = caller_id and revoked_at is null;

  return link_token;
end;
$$;

create or replace function public.resolve_friend_link(p_link_token text)
returns table (profile_id uuid, username text, display_name text, initials text, avatar_color text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.initials, p.avatar_color
  from public.friend_links fl
  join public.profiles p on p.id = fl.profile_id
  where fl.token = p_link_token
    and fl.revoked_at is null
  limit 1;
$$;

create or replace function public.request_friend_by_link(p_link_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_id uuid;
  existing public.friendships;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select profile_id into target_id
  from public.friend_links
  where token = p_link_token and revoked_at is null;

  if target_id is null then
    raise exception 'Friend link not found';
  end if;
  if target_id = caller_id then
    raise exception 'You cannot add yourself';
  end if;

  select * into existing
  from public.friendships
  where (requester_id = caller_id and addressee_id = target_id)
     or (requester_id = target_id and addressee_id = caller_id)
  limit 1
  for update;

  if existing.id is not null then
    if existing.status = 'blocked' then
      raise exception 'This connection is unavailable';
    end if;
    if existing.status = 'pending' and existing.requester_id = target_id then
      update public.friendships set status = 'accepted', updated_at = now() where id = existing.id;
      return 'accepted';
    end if;
    return existing.status::text;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (caller_id, target_id, 'pending');
  return 'pending';
end;
$$;

revoke all on function public.get_or_create_friend_link() from public;
grant execute on function public.get_or_create_friend_link() to authenticated;
revoke all on function public.resolve_friend_link(text) from public;
grant execute on function public.resolve_friend_link(text) to anon, authenticated;
revoke all on function public.request_friend_by_link(text) from public;
grant execute on function public.request_friend_by_link(text) to authenticated;
