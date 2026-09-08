-- Room invites may only target an accepted reciprocal friend.
drop policy if exists "room invites participants" on room_invites;

create policy "room invites participants" on room_invites for all
using (inviter_id = auth.uid() or invitee_id = auth.uid())
with check (
  inviter_id = auth.uid()
  and invitee_id <> auth.uid()
  and exists (
    select 1 from rooms r
    where r.id = room_id
      and (
        r.creator_id = auth.uid()
        or (r.participants_can_invite and exists (select 1 from room_members m where m.room_id = r.id and m.profile_id = auth.uid()))
      )
  )
  and exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = invitee_id) or (f.addressee_id = auth.uid() and f.requester_id = invitee_id))
  )
);
