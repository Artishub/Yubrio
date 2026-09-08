-- Keep one contextual conversation per availability and friend pair, regardless
-- of which participant opened it first.
alter table public.availability_conversations
  add constraint availability_conversations_distinct_profiles
  check (profile_a_id <> profile_b_id);

create unique index availability_conversations_pair_key
  on public.availability_conversations (
    availability_id,
    least(profile_a_id, profile_b_id),
    greatest(profile_a_id, profile_b_id)
  );
