-- Re-check friend and circle boundaries inside atomic writes.
-- Client-side audience pickers are convenience only; these checks are the
-- privacy boundary for rooms, circles, and availability.

create or replace function public.create_circle_atomic(
  p_name text,
  p_member_ids uuid[] default '{}'::uuid[]
)
returns public.circles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  created_circle public.circles;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 60 then
    raise exception 'Circle names must be between 1 and 60 characters';
  end if;
  if exists (
    select 1
    from (select distinct unnest(coalesce(p_member_ids, '{}'::uuid[])) as member_id) members
    where member_id <> caller_id
      and not exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = caller_id and f.addressee_id = member_id)
            or (f.addressee_id = caller_id and f.requester_id = member_id))
      )
  ) then
    raise exception 'Circles can only include accepted friends';
  end if;

  insert into public.circles (owner_id, name)
  values (caller_id, trim(p_name))
  returning * into created_circle;

  insert into public.circle_members (circle_id, profile_id)
  select created_circle.id, member_id
  from (select distinct unnest(coalesce(p_member_ids, '{}'::uuid[])) as member_id) members
  where member_id <> caller_id;

  return created_circle;
end;
$$;

create or replace function public.create_room_atomic(
  p_activity text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_location_mode public.room_location_mode,
  p_place_name text default null,
  p_online_details text default null,
  p_chat_enabled boolean default true,
  p_participants_can_invite boolean default true,
  p_audience_kind public.audience_kind default 'everyone',
  p_circle_ids uuid[] default '{}'::uuid[],
  p_profile_ids uuid[] default '{}'::uuid[]
)
returns public.rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  created_room public.rooms;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(coalesce(p_activity, ''))) = 0 then
    raise exception 'Choose an activity';
  end if;
  if char_length(trim(coalesce(p_title, ''))) not between 1 and 80 then
    raise exception 'Room titles must be between 1 and 80 characters';
  end if;
  if p_ends_at <= p_starts_at or p_ends_at > p_starts_at + interval '24 hours' then
    raise exception 'Rooms can last up to 24 hours';
  end if;
  if p_audience_kind = 'circle' and cardinality(coalesce(p_circle_ids, '{}'::uuid[])) = 0 then
    raise exception 'Choose at least one circle';
  end if;
  if p_audience_kind = 'people' and cardinality(coalesce(p_profile_ids, '{}'::uuid[])) = 0 then
    raise exception 'Choose at least one friend';
  end if;
  if p_audience_kind = 'circle' and exists (
    select 1
    from (select distinct unnest(coalesce(p_circle_ids, '{}'::uuid[])) as circle_id) selected
    where not exists (
      select 1 from public.circles c where c.id = selected.circle_id and c.owner_id = caller_id
    )
  ) then
    raise exception 'You can only use your own circles';
  end if;
  if p_audience_kind = 'people' and exists (
    select 1
    from (select distinct unnest(coalesce(p_profile_ids, '{}'::uuid[])) as profile_id) selected
    where profile_id <> caller_id
      and not exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = caller_id and f.addressee_id = profile_id)
            or (f.addressee_id = caller_id and f.requester_id = profile_id))
      )
  ) then
    raise exception 'Rooms can only be shared with accepted friends';
  end if;

  insert into public.rooms (
    creator_id, activity, title, starts_at, ends_at, location_mode,
    place_name, online_details, chat_enabled, participants_can_invite
  )
  values (
    caller_id, trim(p_activity), trim(p_title), p_starts_at, p_ends_at,
    p_location_mode, nullif(trim(p_place_name), ''), nullif(trim(p_online_details), ''),
    p_chat_enabled, p_participants_can_invite
  )
  returning * into created_room;

  if p_audience_kind = 'everyone' then
    insert into public.room_audiences (room_id, audience_kind)
    values (created_room.id, 'everyone');
  elsif p_audience_kind = 'circle' then
    insert into public.room_audiences (room_id, audience_kind, circle_id)
    select created_room.id, 'circle', circle_id
    from (select distinct unnest(coalesce(p_circle_ids, '{}'::uuid[])) as circle_id) circles;
  else
    insert into public.room_audiences (room_id, audience_kind, profile_id)
    select created_room.id, 'people', profile_id
    from (select distinct unnest(coalesce(p_profile_ids, '{}'::uuid[])) as profile_id) people;
  end if;

  insert into public.room_members (room_id, profile_id)
  values (created_room.id, caller_id);

  return created_room;
end;
$$;

create or replace function public.publish_availability_atomic(
  p_expires_at timestamptz,
  p_audience public.audience_kind default 'everyone',
  p_circle_ids uuid[] default '{}'::uuid[],
  p_profile_ids uuid[] default '{}'::uuid[],
  p_note text default null,
  p_allow_messages boolean default true
)
returns public.availability
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  published public.availability;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '24 hours' then
    raise exception 'Availability can last up to 24 hours';
  end if;
  if char_length(coalesce(p_note, '')) > 240 then
    raise exception 'Availability notes must be 240 characters or fewer';
  end if;
  if p_audience = 'circle' and cardinality(coalesce(p_circle_ids, '{}'::uuid[])) = 0 then
    raise exception 'Choose at least one circle';
  end if;
  if p_audience = 'people' and cardinality(coalesce(p_profile_ids, '{}'::uuid[])) = 0 then
    raise exception 'Choose at least one friend';
  end if;
  if p_audience = 'circle' and exists (
    select 1
    from (select distinct unnest(coalesce(p_circle_ids, '{}'::uuid[])) as circle_id) selected
    where not exists (
      select 1 from public.circles c where c.id = selected.circle_id and c.owner_id = caller_id
    )
  ) then
    raise exception 'You can only use your own circles';
  end if;
  if p_audience = 'people' and exists (
    select 1
    from (select distinct unnest(coalesce(p_profile_ids, '{}'::uuid[])) as profile_id) selected
    where profile_id <> caller_id
      and not exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = caller_id and f.addressee_id = profile_id)
            or (f.addressee_id = caller_id and f.requester_id = profile_id))
      )
  ) then
    raise exception 'Availability can only be shared with accepted friends';
  end if;

  delete from public.availability
  where profile_id = caller_id and expires_at > now();

  insert into public.availability (profile_id, expires_at, audience, note, allow_messages)
  values (caller_id, p_expires_at, p_audience, nullif(trim(p_note), ''), p_allow_messages)
  returning * into published;

  if p_audience = 'circle' then
    insert into public.availability_audiences (availability_id, audience_kind, circle_id)
    select published.id, 'circle', circle_id
    from (select distinct unnest(coalesce(p_circle_ids, '{}'::uuid[])) as circle_id) circles;
  elsif p_audience = 'people' then
    insert into public.availability_audiences (availability_id, audience_kind, profile_id)
    select published.id, 'people', profile_id
    from (select distinct unnest(coalesce(p_profile_ids, '{}'::uuid[])) as profile_id) people;
  end if;

  return published;
end;
$$;

revoke all on function public.create_circle_atomic(text, uuid[]) from public;
revoke all on function public.create_room_atomic(text, text, timestamptz, timestamptz, public.room_location_mode, text, text, boolean, boolean, public.audience_kind, uuid[], uuid[]) from public;
revoke all on function public.publish_availability_atomic(timestamptz, public.audience_kind, uuid[], uuid[], text, boolean) from public;
grant execute on function public.create_circle_atomic(text, uuid[]) to authenticated;
grant execute on function public.create_room_atomic(text, text, timestamptz, timestamptz, public.room_location_mode, text, text, boolean, boolean, public.audience_kind, uuid[], uuid[]) to authenticated;
grant execute on function public.publish_availability_atomic(timestamptz, public.audience_kind, uuid[], uuid[], text, boolean) to authenticated;
