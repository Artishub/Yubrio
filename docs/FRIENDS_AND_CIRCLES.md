# Friends and circles

## Friendships

Friendships are reciprocal and use `pending`, `accepted`, and `blocked` states. Never model friends as followers. The UI supports a scannable QR, share link, and deep-linked friend preview. In the remote path, the link carries an opaque capability token; it never grants direct profile-table access. A new link scan creates a pending request; scanning an existing pending request accepts it. The UI distinguishes “Friend request sent” from an accepted connection and gives the recipient inline accept/block actions.

## Circles

Circles are private organizational lists such as Close Friends, Gaming, Work, Uni, or Gym. Friends do not know which circles contain them. A room or availability can target multiple circles or selected people.

## Invitations

The room creator controls “Participants can invite others”. When on, participants may invite their own accepted Yubrio friends; when off, only the creator can invite. There is no automatic public exposure.

## Privacy

RLS must filter friend and circle membership data on the server. Blocked users cannot view one another’s availability, rooms, or contextual conversations.
