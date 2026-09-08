-- Invited friends can discover a private room they were directly invited to.
-- Keep the access temporary and inside the same short archive window as rooms
-- already visible through the normal audience/member paths.

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
        or (
          r.ends_at + interval '2 hours' > now()
          and exists (
            select 1
            from public.room_invites ri
            where ri.room_id = r.id
              and ri.invitee_id = (select auth.uid())
          )
        )
      )
  );
$$;

revoke execute on function private.can_view_room(uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.can_view_room(uuid)
  to authenticated;
