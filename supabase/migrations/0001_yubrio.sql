-- Yubrio relational foundation. Apply with Supabase migrations; RLS is the privacy boundary.
create extension if not exists pgcrypto;

create type friendship_status as enum ('pending', 'accepted', 'blocked');
create type audience_kind as enum ('everyone', 'circle', 'people');
create type room_location_mode as enum ('in_person', 'online', 'undecided');

create table profiles (id uuid primary key references auth.users(id) on delete cascade, username text unique, display_name text not null, initials text not null, avatar_color text not null default '#D9F96B', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table friendships (id uuid primary key default gen_random_uuid(), requester_id uuid not null references profiles(id) on delete cascade, addressee_id uuid not null references profiles(id) on delete cascade, status friendship_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (requester_id <> addressee_id), unique (requester_id, addressee_id));
create table circles (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id) on delete cascade, name text not null check (char_length(name) between 1 and 60), created_at timestamptz not null default now());
create table circle_members (circle_id uuid not null references circles(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key (circle_id, profile_id));
create table availability (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, expires_at timestamptz not null, audience audience_kind not null default 'everyone', note text check (char_length(note) <= 240), allow_messages boolean not null default true, created_at timestamptz not null default now(), check (expires_at > created_at and expires_at <= created_at + interval '24 hours'));
create table rooms (id uuid primary key default gen_random_uuid(), creator_id uuid not null references profiles(id) on delete cascade, activity text not null, title text not null check (char_length(title) between 1 and 80), starts_at timestamptz not null, ends_at timestamptz not null, location_mode room_location_mode not null default 'undecided', place_name text, online_details text, chat_enabled boolean not null default true, participants_can_invite boolean not null default true, created_at timestamptz not null default now(), check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours'));
create table room_audiences (id uuid primary key default gen_random_uuid(), room_id uuid not null references rooms(id) on delete cascade, audience_kind audience_kind not null, circle_id uuid references circles(id) on delete cascade, profile_id uuid references profiles(id) on delete cascade, check ((audience_kind = 'circle' and circle_id is not null and profile_id is null) or (audience_kind = 'people' and profile_id is not null and circle_id is null) or (audience_kind = 'everyone' and circle_id is null and profile_id is null)));
create table room_members (room_id uuid not null references rooms(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade, arrival_at timestamptz, joined_at timestamptz not null default now(), primary key (room_id, profile_id));
create table room_invites (id uuid primary key default gen_random_uuid(), room_id uuid not null references rooms(id) on delete cascade, inviter_id uuid not null references profiles(id) on delete cascade, invitee_id uuid not null references profiles(id) on delete cascade, created_at timestamptz not null default now(), unique (room_id, invitee_id));
create table room_suggestions (id uuid primary key default gen_random_uuid(), room_id uuid not null references rooms(id) on delete cascade, author_id uuid not null references profiles(id) on delete cascade, activity text not null, title text not null, created_at timestamptz not null default now());
create table room_messages (id uuid primary key default gen_random_uuid(), room_id uuid not null references rooms(id) on delete cascade, author_id uuid not null references profiles(id) on delete cascade, body text not null check (char_length(body) between 1 and 1000), created_at timestamptz not null default now());
create table availability_conversations (id uuid primary key default gen_random_uuid(), availability_id uuid not null references availability(id) on delete cascade, profile_a_id uuid not null references profiles(id) on delete cascade, profile_b_id uuid not null references profiles(id) on delete cascade, inactive_at timestamptz, unique (availability_id, profile_a_id, profile_b_id));
create table availability_messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references availability_conversations(id) on delete cascade, author_id uuid not null references profiles(id) on delete cascade, body text not null check (char_length(body) between 1 and 1000), created_at timestamptz not null default now());
create table games (id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz not null default now());
create table user_game_profiles (profile_id uuid not null references profiles(id) on delete cascade, game_id uuid not null references games(id) on delete cascade, username text, platform text, details text, updated_at timestamptz not null default now(), primary key (profile_id, game_id));
create table push_tokens (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, token text not null unique, platform text not null, created_at timestamptz not null default now());
create table notifications (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, type text not null, title text not null, body text not null, room_id uuid references rooms(id) on delete cascade, availability_id uuid references availability(id) on delete cascade, read_at timestamptz, created_at timestamptz not null default now());

alter table profiles enable row level security;
alter table friendships enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table availability enable row level security;
alter table rooms enable row level security;
alter table room_audiences enable row level security;
alter table room_members enable row level security;
alter table room_invites enable row level security;
alter table room_suggestions enable row level security;
alter table room_messages enable row level security;
alter table availability_conversations enable row level security;
alter table availability_messages enable row level security;
alter table games enable row level security;
alter table user_game_profiles enable row level security;
alter table push_tokens enable row level security;
alter table notifications enable row level security;

create policy "own profile or accepted friend" on profiles for select using (id = auth.uid() or exists (select 1 from friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id) or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))));
create policy "create own profile" on profiles for insert with check (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "friendship participants" on friendships for all using (requester_id = auth.uid() or addressee_id = auth.uid()) with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "circle owner" on circles for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "circle members owner" on circle_members for all using (exists (select 1 from circles c where c.id = circle_id and c.owner_id = auth.uid())) with check (exists (select 1 from circles c where c.id = circle_id and c.owner_id = auth.uid()));
create policy "availability author" on availability for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "targeted availability read" on availability for select using (
  profile_id = auth.uid() or
  (audience = 'everyone' and exists (select 1 from friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = profile_id) or (f.addressee_id = auth.uid() and f.requester_id = profile_id)))) or
  (audience = 'people' and exists (select 1 from availability_conversations c where c.availability_id = availability.id and (c.profile_a_id = auth.uid() or c.profile_b_id = auth.uid())))
);
create policy "room creator" on rooms for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "room audience read" on rooms for select using (
  creator_id = auth.uid() or exists (select 1 from room_members m where m.room_id = rooms.id and m.profile_id = auth.uid()) or
  exists (select 1 from friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = creator_id) or (f.addressee_id = auth.uid() and f.requester_id = creator_id)) and exists (select 1 from room_audiences a where a.room_id = rooms.id and (a.audience_kind = 'everyone' or (a.audience_kind = 'people' and a.profile_id = auth.uid()) or (a.audience_kind = 'circle' and exists (select 1 from circle_members cm where cm.circle_id = a.circle_id and cm.profile_id = auth.uid())))))
);
create policy "room audience managed by creator" on room_audiences for all using (exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid())) with check (exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid()));
create policy "room member" on room_members for all using (profile_id = auth.uid() or exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid())) with check (
  (profile_id = auth.uid() and exists (select 1 from rooms r where r.id = room_id and (r.creator_id = auth.uid() or exists (select 1 from friendships f where f.status = 'accepted' and ((f.requester_id = auth.uid() and f.addressee_id = r.creator_id) or (f.addressee_id = auth.uid() and f.requester_id = r.creator_id)) and exists (select 1 from room_audiences a where a.room_id = r.id and (a.audience_kind = 'everyone' or (a.audience_kind = 'people' and a.profile_id = auth.uid()) or (a.audience_kind = 'circle' and exists (select 1 from circle_members cm where cm.circle_id = a.circle_id and cm.profile_id = auth.uid()))))))))
  or exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid())
);
create policy "room invites participants" on room_invites for all using (inviter_id = auth.uid() or invitee_id = auth.uid()) with check (inviter_id = auth.uid() and exists (select 1 from rooms r where r.id = room_id and (r.creator_id = auth.uid() or (r.participants_can_invite and exists (select 1 from room_members m where m.room_id = r.id and m.profile_id = auth.uid())))));
create policy "room suggestions participants" on room_suggestions for all using (author_id = auth.uid() or exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid()) or exists (select 1 from room_members m where m.room_id = room_id and m.profile_id = auth.uid())) with check (author_id = auth.uid() and (exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid()) or exists (select 1 from room_members m where m.room_id = room_id and m.profile_id = auth.uid())));
create policy "room participant messages" on room_messages for all using (author_id = auth.uid() or exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid()) or exists (select 1 from room_members m where m.room_id = room_id and m.profile_id = auth.uid())) with check (author_id = auth.uid() and (exists (select 1 from rooms r where r.id = room_id and r.creator_id = auth.uid()) or exists (select 1 from room_members m where m.room_id = room_id and m.profile_id = auth.uid())));
create policy "availability conversation participants" on availability_conversations for all using (profile_a_id = auth.uid() or profile_b_id = auth.uid()) with check (profile_a_id = auth.uid() or profile_b_id = auth.uid());
create policy "availability messages participants" on availability_messages for all using (author_id = auth.uid() or exists (select 1 from availability_conversations c where c.id = conversation_id and (c.profile_a_id = auth.uid() or c.profile_b_id = auth.uid()))) with check (author_id = auth.uid() and exists (select 1 from availability_conversations c where c.id = conversation_id and (c.profile_a_id = auth.uid() or c.profile_b_id = auth.uid())));
create policy "games readable" on games for select using (true);
create policy "own game profiles" on user_game_profiles for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own push tokens" on push_tokens for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own notifications" on notifications for select using (profile_id = auth.uid());

create unique index friendships_pair_key on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index availability_expiry_idx on availability (expires_at);
create index rooms_active_idx on rooms (ends_at, starts_at);
