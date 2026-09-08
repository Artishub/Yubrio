-- Keep availability conversations inside the same audience and messageability
-- boundary as the availability card itself.

create index if not exists availability_profile_expiry_idx
  on public.availability (profile_id, expires_at);
create index if not exists availability_conversations_profile_a_idx
  on public.availability_conversations (profile_a_id);
create index if not exists availability_conversations_profile_b_idx
  on public.availability_conversations (profile_b_id);
create index if not exists availability_messages_conversation_idx
  on public.availability_messages (conversation_id, created_at);

create or replace function private.can_message_availability(
  target_availability_id uuid,
  viewer_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = viewer_profile_id
    and exists (
      select 1
      from public.availability a
      where a.id = target_availability_id
        and a.allow_messages
        and a.expires_at + interval '2 hours' > now()
        and (
          a.profile_id = viewer_profile_id
          or (
            exists (
              select 1
              from public.friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = viewer_profile_id and f.addressee_id = a.profile_id)
                  or (f.addressee_id = viewer_profile_id and f.requester_id = a.profile_id)
                )
            )
            and (
              a.audience = 'everyone'
              or (
                a.audience = 'people'
                and exists (
                  select 1
                  from public.availability_audiences aa
                  where aa.availability_id = a.id
                    and aa.audience_kind = 'people'
                    and aa.profile_id = viewer_profile_id
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
                    and cm.profile_id = viewer_profile_id
                )
              )
            )
          )
        )
    );
$$;

revoke execute on function private.can_message_availability(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.can_message_availability(uuid, uuid)
  to authenticated;

drop policy if exists "availability conversation participants insert"
  on public.availability_conversations;
create policy "availability conversation participants insert"
  on public.availability_conversations
  for insert to authenticated
  with check (
    profile_a_id <> profile_b_id
    and (
      (
        profile_a_id = (select auth.uid())
        and (select private.can_message_availability(availability_id, profile_a_id))
        and exists (
          select 1
          from public.availability a
          where a.id = availability_id and a.profile_id = profile_b_id
        )
      )
      or (
        profile_b_id = (select auth.uid())
        and (select private.can_message_availability(availability_id, profile_b_id))
        and exists (
          select 1
          from public.availability a
          where a.id = availability_id and a.profile_id = profile_a_id
        )
      )
    )
  );

drop policy if exists "availability messages participants insert"
  on public.availability_messages;
create policy "availability messages participants insert"
  on public.availability_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.availability_conversations c
      where c.id = conversation_id
        and (c.profile_a_id = (select auth.uid()) or c.profile_b_id = (select auth.uid()))
        and (select private.can_message_availability(c.availability_id, (select auth.uid())))
    )
  );
