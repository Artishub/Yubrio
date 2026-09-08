-- Deliver direct room invitations to the invited friend so private rooms can
-- appear promptly without polling the whole database.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_invites'
  ) then
    alter publication supabase_realtime add table public.room_invites;
  end if;
end
$$;
