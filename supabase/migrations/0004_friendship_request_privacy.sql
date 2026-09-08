-- Friendship requests must come through a shared friend link. This prevents a
-- client from inserting a request for an arbitrary profile id.
revoke insert, update on public.friendships from anon, authenticated;

drop policy if exists "own profile or accepted friend" on public.profiles;
create policy "own profile or friend relationship" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = (select auth.uid()) and f.addressee_id = profiles.id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = profiles.id))
    )
    or exists (
      select 1 from public.friendships f
      where f.status = 'pending'
        and ((f.requester_id = (select auth.uid()) and f.addressee_id = profiles.id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = profiles.id))
    )
  );

create or replace function public.respond_to_friend_request(p_friendship_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  next_status public.friendship_status;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if p_action not in ('accepted', 'blocked') then
    raise exception 'Unsupported friendship action';
  end if;

  next_status := p_action::public.friendship_status;

  update public.friendships
  set status = next_status, updated_at = now()
  where id = p_friendship_id
    and addressee_id = caller_id
    and status = 'pending';

  if not found then
    raise exception 'Friend request is no longer available';
  end if;

  return p_action;
end;
$$;

revoke all on function public.respond_to_friend_request(uuid, text) from public;
grant execute on function public.respond_to_friend_request(uuid, text) to authenticated;
