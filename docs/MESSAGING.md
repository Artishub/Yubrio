# Messaging

Messaging is temporary and contextual, not a permanent inbox.

## Availability conversations

An availability conversation exists while a friend is messageable. It supports short coordination (“Coffee?”, “Wanna game?”), suggestion, and room creation. The database checks friendship, the availability audience, `allow_messages`, and the two-hour grace period before allowing a conversation or new message. After availability expiry plus that grace period, it becomes inactive; history may remain viewable but cannot receive new messages.

## Room chat

Room chat is optional and on by default. It supports coordination, location changes, arrival timing, suggestions, and quick conversation. It is scoped to the room and becomes read-only after expiry for a short archive period.

Suggestions are lightweight activity prompts inside the room. A participant can suggest one alternative, and people can discuss or act on it in chat; suggestions are not polls, votes, or a separate project-management surface.

## Safety and failure

RLS limits reads/writes to participants and targeted friends. Empty, loading, offline, and send-error states are inline and recoverable. Avoid corporate copy such as “attendance confirmed”.
