-- Privacy helpers and audience rows for circle/specific-friend availability.
-- Apply after 0001_yubrio.sql.

create table if not exists public.availability_audiences (
  id uuid primary key default gen_random_uuid(),
  availability_id uuid not null references public.availability(id) on delete cascade,
  audience_kind audience_kind not null check (audience_kind in ('circle', 'people')),
  circle_id uuid references public.circles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  check (
    (audience_kind = 'circle' and circle_id is not null and profile_id is null) or
    (audience_kind = 'people' and profile_id is not null and circle_id is null)
  )
);

alter table public.availability_audiences enable row level security;

create index if not exists availability_audiences_availability_idx
  on public.availability_audiences (availability_id);
create index if not exists availability_audiences_circle_idx
  on public.availability_audiences (circle_id)
  where circle_id is not null;
create index if not exists availability_audiences_profile_idx
  on public.availability_audiences (profile_id)
  where profile_id is not null;
create index if not exists friendships_lookup_idx
  on public.friendships (requester_id, addressee_id, status);
create index if not exists circle_members_profile_idx
  on public.circle_members (profile_id, circle_id);

create schema if not exists private;

create or replace function private.can_view_availability(target_availability_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.availability a
    where a.id = target_availability_id
      and (
        a.profile_id = (select auth.uid())
        or (
          a.expires_at > now()
          and exists (
            select 1
            from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = (select auth.uid()) and f.addressee_id = a.profile_id)
                or (f.addressee_id = (select auth.uid()) and f.requester_id = a.profile_id)
              )
          )
          and (
            a.audience = 'everyone'
            or (
              a.audience = 'people'
              and exists (
                select 1 from public.availability_audiences aa
                where aa.availability_id = a.id
                  and aa.audience_kind = 'people'
                  and aa.profile_id = (select auth.uid())
              )
            )
            or (
              a.audience = 'circle'
              and exists (
                select 1
                from public.availability_audiences aa
                join public.circle_members cm on cm.circle_id = aa.circle_id
                where aa.availability_id = a.id
                  and aa.audience_kind = 'circle'
                  and cm.profile_id = (select auth.uid())
              )
            )
          )
        )
      )
  );
$$;

create or replace function private.can_view_room(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and (
        r.creator_id = (select auth.uid())
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.profile_id = (select auth.uid())
        )
        or (
          exists (
            select 1
            from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = (select auth.uid()) and f.addressee_id = r.creator_id)
                or (f.addressee_id = (select auth.uid()) and f.requester_id = r.creator_id)
              )
          )
          and exists (
            select 1
            from public.room_audiences ra
            where ra.room_id = r.id
              and (
                ra.audience_kind = 'everyone'
                or (ra.audience_kind = 'people' and ra.profile_id = (select auth.uid()))
                or (
                  ra.audience_kind = 'circle'
                  and exists (
                    select 1 from public.circle_members cm
                    where cm.circle_id = ra.circle_id and cm.profile_id = (select auth.uid())
                  )
                )
              )
          )
        )
      )
  );
$$;

revoke execute on function private.can_view_availability(uuid) from public, anon, authenticated, service_role;
revoke execute on function private.can_view_room(uuid) from public, anon, authenticated, service_role;
grant execute on function private.can_view_availability(uuid) to authenticated;
grant execute on function private.can_view_room(uuid) to authenticated;

create policy "availability audience owner" on public.availability_audiences
  for all to authenticated
  using (exists (
    select 1 from public.availability a
    where a.id = availability_id and a.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.availability a
    where a.id = availability_id and a.profile_id = (select auth.uid())
  ));

drop policy if exists "targeted availability read" on public.availability;
create policy "targeted availability read" on public.availability
  for select to authenticated
  using ((select private.can_view_availability(id)));

drop policy if exists "room audience read" on public.rooms;
create policy "room audience read" on public.rooms
  for select to authenticated
  using ((select private.can_view_room(id)));

drop policy if exists "room member" on public.room_members;
create policy "room member read" on public.room_members
  for select to authenticated
  using ((select private.can_view_room(room_id)));
create policy "room member join" on public.room_members
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select private.can_view_room(room_id))
    and exists (select 1 from public.rooms r where r.id = room_id and r.ends_at > now())
  );
create policy "room member update" on public.room_members
  for update to authenticated
  using (profile_id = (select auth.uid()) and (select private.can_view_room(room_id)))
  with check (profile_id = (select auth.uid()) and (select private.can_view_room(room_id)));
create policy "room member leave" on public.room_members
  for delete to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (select 1 from public.rooms r where r.id = room_id and r.creator_id = (select auth.uid()))
  );

drop policy if exists "room participant messages" on public.room_messages;
create policy "room participant messages read" on public.room_messages
  for select to authenticated
  using (
    exists (select 1 from public.rooms r where r.id = room_id and r.creator_id = (select auth.uid()))
    or exists (select 1 from public.room_members rm where rm.room_id = room_id and rm.profile_id = (select auth.uid()))
  );
create policy "room participant messages insert" on public.room_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.rooms r where r.id = room_id and r.chat_enabled and r.ends_at > now() and (r.creator_id = (select auth.uid()) or exists (select 1 from public.room_members rm where rm.room_id = r.id and rm.profile_id = (select auth.uid()))))
  );

drop policy if exists "availability conversation participants" on public.availability_conversations;
create policy "availability conversation participants read" on public.availability_conversations
  for select to authenticated
  using (profile_a_id = (select auth.uid()) or profile_b_id = (select auth.uid()));
create policy "availability conversation participants insert" on public.availability_conversations
  for insert to authenticated
  with check (
    profile_a_id <> profile_b_id
    and (profile_a_id = (select auth.uid()) or profile_b_id = (select auth.uid()))
    and exists (
      select 1
      from public.availability a
      where a.id = availability_id
        and a.allow_messages
        and a.expires_at + interval '2 hours' > now()
        and (
          (a.profile_id = profile_a_id and profile_b_id = (select auth.uid()))
          or (a.profile_id = profile_b_id and profile_a_id = (select auth.uid()))
        )
        and exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = profile_a_id and f.addressee_id = profile_b_id)
              or (f.requester_id = profile_b_id and f.addressee_id = profile_a_id)
            )
        )
    )
  );

drop policy if exists "availability messages participants" on public.availability_messages;
create policy "availability messages participants read" on public.availability_messages
  for select to authenticated
  using (exists (
    select 1 from public.availability_conversations c
    where c.id = conversation_id and (c.profile_a_id = (select auth.uid()) or c.profile_b_id = (select auth.uid()))
  ));
create policy "availability messages participants insert" on public.availability_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.availability_conversations c
      join public.availability a on a.id = c.availability_id
      where c.id = conversation_id
        and (c.profile_a_id = (select auth.uid()) or c.profile_b_id = (select auth.uid()))
        and a.allow_messages
        and a.expires_at + interval '2 hours' > now()
    )
  );
