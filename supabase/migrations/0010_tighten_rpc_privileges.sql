-- Keep the shared friend-link preview public, but require authentication for
-- every mutation and private friend-link operation.
revoke all on function public.get_or_create_friend_link() from public, anon, authenticated;
revoke all on function public.resolve_friend_link(text) from public, anon, authenticated;
revoke all on function public.request_friend_by_link(text) from public, anon, authenticated;
revoke all on function public.respond_to_friend_request(uuid, text) from public, anon, authenticated;
revoke all on function public.create_circle_atomic(text, uuid[]) from public, anon, authenticated;
revoke all on function public.create_room_atomic(text, text, timestamptz, timestamptz, public.room_location_mode, text, text, boolean, boolean, public.audience_kind, uuid[], uuid[]) from public, anon, authenticated;
revoke all on function public.publish_availability_atomic(timestamptz, public.audience_kind, uuid[], uuid[], text, boolean) from public, anon, authenticated;

grant execute on function public.resolve_friend_link(text) to anon, authenticated;
grant execute on function public.get_or_create_friend_link() to authenticated;
grant execute on function public.request_friend_by_link(text) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, text) to authenticated;
grant execute on function public.create_circle_atomic(text, uuid[]) to authenticated;
grant execute on function public.create_room_atomic(text, text, timestamptz, timestamptz, public.room_location_mode, text, text, boolean, boolean, public.audience_kind, uuid[], uuid[]) to authenticated;
grant execute on function public.publish_availability_atomic(timestamptz, public.audience_kind, uuid[], uuid[], text, boolean) to authenticated;
